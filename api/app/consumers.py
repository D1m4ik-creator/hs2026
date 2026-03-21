from asgiref.sync import sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer, AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
import json

from .models import Broadcast, BroadcastQueueItem, MediaFile, PlayListItem, Message
from .serializers import MessageListenerSerializer

User = get_user_model()


class BroadcastConsumer(AsyncJsonWebsocketConsumer):
    group_name = "broadcast_room"

    async def connect(self):
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

        state = await self._get_broadcast_state_for_listener()
        if state:
            await self.send_json(state)

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        action = content.get("action")

        user = self.scope.get("user")
        if not user or not user.is_authenticated:
            await self.send_json({"type": "error", "detail": "Требуется авторизация"})
            return

        roles = set(getattr(user, "roles", []) or [])
        if "host" not in roles and "admin" not in roles:
            await self.send_json({"type": "error", "detail": "Недостаточно прав"})
            return

        if action == "enqueue":
            media_file_id = content.get("media_file_id")
            playlist_item_id = content.get("playlist_item_id")
            payload = await self._enqueue_and_maybe_start(
                user.id if user and user.is_authenticated else None,
                media_file_id,
                playlist_item_id,
            )
        elif action == "play_next":
            payload = await self._play_next()
        elif action == "track_ended":
            payload = await self._track_ended()
        else:
            await self.send_json({"type": "error", "detail": "Неподдерживаемое действие"})
            return

        if not payload:
            await self.send_json({"type": "error", "detail": "Не удалось обработать действие"})
            return

        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "broadcast.update",
                "payload": payload,
            },
        )

    async def broadcast_update(self, event):
        await self.send_json(event["payload"])

    @sync_to_async
    def _enqueue_and_maybe_start(self, user_id, media_file_id, playlist_item_id):
        media = None
        if media_file_id:
            media = MediaFile.objects.filter(id=media_file_id, is_deleted=False).first()
        elif playlist_item_id:
            item = PlayListItem.objects.select_related("media").filter(id=playlist_item_id).first()
            media = item.media if item else None

        if not media:
            return None

        added_by = None
        if user_id:
            added_by = User.objects.filter(id=user_id).first()

        BroadcastQueueItem.objects.create(
            media=media,
            added_by=added_by,
            status=BroadcastQueueItem.Status.QUEUED,
        )

        current = BroadcastQueueItem.objects.select_related("media").filter(
            status=BroadcastQueueItem.Status.PLAYING
        ).first()
        if current:
            return self._build_payload_from_item(current)

        return self._start_next_queued_item()

    @sync_to_async
    def _play_next(self):
        return self._advance_queue()

    @sync_to_async
    def _track_ended(self):
        return self._advance_queue()

    @sync_to_async
    def _get_broadcast_state_for_listener(self):
        current = BroadcastQueueItem.objects.select_related("media").filter(
            status=BroadcastQueueItem.Status.PLAYING
        ).first()
        if not current:
            return self._build_idle_payload()

        payload = self._build_payload_from_item(current)
        if current.started_at:
            payload["offset"] = max(0, int((timezone.now() - current.started_at).total_seconds()))
        return payload

    def _start_next_queued_item(self):
        next_item = BroadcastQueueItem.objects.select_related("media").filter(
            status=BroadcastQueueItem.Status.QUEUED
        ).order_by("enqueued_at", "id").first()

        broadcast, _ = Broadcast.objects.get_or_create(pk=1)
        if not next_item:
            broadcast.is_active = False
            broadcast.started_at = None
            broadcast.current_item = None
            broadcast.current_playlist = None
            broadcast.save()
            return self._build_idle_payload()

        started_at = timezone.now()
        next_item.status = BroadcastQueueItem.Status.PLAYING
        next_item.started_at = started_at
        next_item.save(update_fields=["status", "started_at"])

        broadcast.is_active = True
        broadcast.started_at = started_at
        broadcast.current_item = None
        broadcast.current_playlist = None
        broadcast.save()

        return self._build_payload_from_item(next_item)

    def _advance_queue(self):
        current = BroadcastQueueItem.objects.filter(status=BroadcastQueueItem.Status.PLAYING).first()
        if current:
            current.status = BroadcastQueueItem.Status.DONE
            current.save(update_fields=["status"])
        return self._start_next_queued_item()

    def _build_payload_from_item(self, item):
        media_url = item.media.file.url if item.media and item.media.file else None
        queue_len = BroadcastQueueItem.objects.filter(status=BroadcastQueueItem.Status.QUEUED).count()
        return {
            "type": "broadcast_update",
            "media_url": media_url,
            "offset": 0,
            "is_active": True,
            "queue_len": queue_len,
            "current_queue_item_id": item.id,
        }

    def _build_idle_payload(self):
        queue_len = BroadcastQueueItem.objects.filter(status=BroadcastQueueItem.Status.QUEUED).count()
        return {
            "type": "broadcast_update",
            "media_url": None,
            "offset": 0,
            "is_active": False,
            "queue_len": queue_len,
            "current_queue_item_id": None,
        }


class MessageConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        # Ведущий и слушатели в разных группах
        self.host_group = 'host_messages'

        # Личная группа слушателя — для обновления статусов его сообщений
        self.user_group = f'user_{user.id}_messages'

        await self.channel_layer.group_add(self.host_group, self.channel_name)
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        await self.accept()

    async def disconnect(self, code):
        await self.channel_layer.group_discard(self.host_group, self.channel_name)
        await self.channel_layer.group_discard(self.user_group, self.channel_name)

    async def receive(self, text_data):
        """Слушатель отправляет сообщение"""
        user = self.scope['user']
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