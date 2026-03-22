from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer, AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from urllib.parse import parse_qs
import json
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.tokens import AccessToken

from .models import Broadcast, BroadcastQueueItem, MediaFile, PlayListItem, Message
from .serializers import MessageListenerSerializer

User = get_user_model()


class BroadcastConsumer(AsyncJsonWebsocketConsumer):
    group_name = "broadcast_room"

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
        state = await self._get_broadcast_state_for_listener()
        if state: await self.send_json(state)

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")
        user = self.scope.get("user")
        if not user or not user.is_authenticated: return

        if action == "enqueue":
            payload = await self._play_track(user.id, content.get("playlist_item_id"))
        elif action in ["play_next", "track_ended"]:
            payload = await self._stop_broadcast()
        else: return

        if payload:
            await self.channel_layer.group_send(
                self.group_name, {"type": "broadcast.update", "payload": payload}
            )

    async def broadcast_update(self, event):
        await self.send_json(event["payload"])

    @sync_to_async
    def _play_track(self, user_id, playlist_item_id):
        item = PlayListItem.objects.select_related("media").filter(id=playlist_item_id).first()
        if not item: return None

        # Останавливаем старые записи
        BroadcastQueueItem.objects.filter(status=BroadcastQueueItem.Status.PLAYING).update(status=BroadcastQueueItem.Status.DONE)
        
        now = timezone.now()
        new_q = BroadcastQueueItem.objects.create(
            media=item.media, status=BroadcastQueueItem.Status.PLAYING, started_at=now
        )

        broadcast, _ = Broadcast.objects.get_or_create(pk=1)
        broadcast.is_active = True
        broadcast.current_item = item # Django сам поймет, что это FK
        broadcast.save()

        return self._build_payload(new_q, broadcast)

    @sync_to_async
    def _stop_broadcast(self):
        BroadcastQueueItem.objects.filter(status=BroadcastQueueItem.Status.PLAYING).update(status=BroadcastQueueItem.Status.DONE)
        broadcast, _ = Broadcast.objects.get_or_create(pk=1)
        broadcast.is_active = False
        broadcast.save()
        return self._build_payload(None, broadcast)

    @sync_to_async
    def _get_broadcast_state_for_listener(self):
        current_q = BroadcastQueueItem.objects.select_related("media").filter(status=BroadcastQueueItem.Status.PLAYING).first()
        broadcast, _ = Broadcast.objects.get_or_create(pk=1)
        return self._build_payload(current_q, broadcast)

    def _build_payload(self, q_item, broadcast):
        # ВАЖНО: используем .current_item_id для сериализации в JSON
        return {
            "type": "broadcast_update",
            "is_active": broadcast.is_active,
            "media_url": q_item.media.file.url if q_item and q_item.media.file else None,
            "current_item": broadcast.current_item_id, 
            "offset": max(0, int((timezone.now() - q_item.started_at).total_seconds())) if q_item and q_item.started_at else 0
        }


class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            token = self._extract_token_from_query()
            user = await self.get_user_from_access_token(token) if token else None

        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user = user

        # Ведущий и слушатели в разных группах
        self.host_group = 'host_messages'

        # Личная группа слушателя — для обновления статусов его сообщений
        self.user_group = f'user_{user.id}_messages'

        await self.channel_layer.group_add(self.host_group, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        if hasattr(self, 'host_group'):
            await self.channel_layer.group_discard(self.host_group, self.channel_name)
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive(self, text_data):
        """Слушатель отправляет сообщение"""
        user = getattr(self, 'user', self.scope.get('user'))
        if not user or not user.is_authenticated:
            await self.send(json.dumps({'error': 'Требуется авторизация.'}))
            await self.close()
            return

        data = json.loads(text_data)
        text = data.get('text', '').strip()

        if not text:
            await self.send(json.dumps({'error': 'Пустое сообщение.'}))
            return

        message = await self.save_message(user, text)

        # Ведущий получает новое сообщение
        await self.channel_layer.group_send(
            self.host_group,
            {'type': 'new_message', 'message': message}
        )

        # Слушатель сразу видит своё сообщение со статусом new
        await self.send(json.dumps({
            'type': 'my_message',
            'message': message
        }))

    async def new_message(self, event):
        """Ведущий получает входящее сообщение"""
        await self.send(json.dumps({
            'type': 'new_message',
            'message': event['message']
        }))

    async def status_update(self, event):
        """
        Слушатель получает обновление статуса своего сообщения.
        Вызывается когда ведущий меняет статус через PATCH /api/messages/{id}/status/
        """
        await self.send(json.dumps({
            'type': 'status_update',
            'message_id': event['message_id'],
            'status': event['status']
        }))

    @database_sync_to_async
    def save_message(self, user, text):
        message = Message.objects.create(
            author=user,
            text=text,
            status=Message.Status.NEW
        )
        return MessageListenerSerializer(message).data

    def _extract_token_from_query(self):
        query_string = self.scope.get('query_string', b'').decode('utf-8')
        query_params = parse_qs(query_string)
        return (query_params.get('token') or [None])[0]

    @database_sync_to_async
    def get_user_from_access_token(self, token):
        try:
            validated_token = AccessToken(token)
            user_id = validated_token.get('user_id')
            if not user_id:
                return None
            return User.objects.filter(id=user_id, is_active=True).first()
        except (TokenError, InvalidToken, ValueError, TypeError):
            return None
