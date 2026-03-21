from django.conf import settings
from rest_framework import status, viewsets
from rest_framework import serializers
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample, OpenApiParameter
from django.utils import timezone
from django.shortcuts import get_object_or_404
import random

from .serializers import *
from .models import *
from .permissions import IsAdmin, IsHost, IsActiveUser

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Аутентификация"],
        summary="Текущий пользователь",
        description=(
            "Возвращает данные текущего пользователя по access токену.\n\n"
        ),
        parameters=[
            OpenApiParameter(
                name="Authorization",
                location=OpenApiParameter.HEADER,
                required=True,
                type=str,
                description="JWT access token в формате: Bearer <access_token>",
            )
        ],
        responses={
            200: UserSerializer,
            401: OpenApiResponse(description="Токен не передан или недействителен"),
        },
        examples=[
            OpenApiExample(
                "Успешный ответ",
                value={
                    "id": 1,
                    "login": "host_user",
                    "full_name": "Иванов Иван Иванович",
                    "roles": ["host"],
                    "avatar": "/media/avatars/avatar.jpg",
                    "date_joined": "2026-03-21T10:30:00Z"
                },
                response_only=True,
                status_codes=["200"],
            ),
            OpenApiExample(
                "Без токена",
                value={"detail": "Учетные данные не были предоставлены."},
                response_only=True,
                status_codes=["401"],
            ),
        ],
    )
    def get(self, request):
        return Response(UserSerializer(request.user).data, status=status.HTTP_200_OK)
    
class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    @extend_schema(
        tags=["Аутентификация"],
        summary="Регистрация пользователя",
        description="Создает нового пользователя с базовой ролью `user`.",
        request=UserRegisterSerializer,
        responses={
            201: UserSerializer,
            400: OpenApiResponse(response=DetailMessageSerializer, description="Ошибка валидации"),
        },
        examples=[
            OpenApiExample(
                "Register request",
                value={
                    "login": "testuser",
                    "full_name": "Иванов Иван Иванович",
                    "password": "StrongPass123!",
                    "password_confirm": "StrongPass123!",
                    "avatar": "(binary file)",
                },
                request_only=True,
            )
        ],
    )
    def post(self, request):
        serializer = UserRegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Аутентификация"],
        summary="Вход в систему",
        description="Аутентифицирует пользователя и возвращает JWT токены.",
        request=LoginRequestSerializer,
        responses={
            200: LoginSuccessSerializer,
            401: OpenApiResponse(response=DetailMessageSerializer, description="Неверный логин или пароль"),
        },
        examples=[
            OpenApiExample(
                "Login request",
                value={"login": "testuser", "password": "StrongPass123!"},
                request_only=True,
            )
        ],
    )
    def post(self, request):
        login = request.data.get('login')
        password = request.data.get('password')

        user = authenticate(request, login=login, password=password)
        if user is None or User.is_deleted == False:
            return Response({"detail": "Неверный логин или пароль"}, status=status.HTTP_401_UNAUTHORIZED)
        
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            "user": UserSerializer(user).data
        })
        

class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        tags=["Аутентификация"],
        summary="Выход из системы",
        description="Отзывает refresh-токен текущего пользователя.",
        request=LogoutSerializer,
        responses={
            205: OpenApiResponse(response=DetailMessageSerializer, description="Успешный выход"),
            400: OpenApiResponse(response=DetailMessageSerializer, description="Некорректный refresh токен"),
        },
        examples=[
            OpenApiExample(
                "Logout request",
                value={"refresh": "<refresh_token>"},
                request_only=True,
            )
        ],
    )
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({"detail": "Refresh токен не предоставлен."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({"detail": "Успешный выход из системы."}, status=status.HTTP_205_RESET_CONTENT)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class MediaFileUploadAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]
    parser_classes = [MultiPartParser, FormParser]

    @extend_schema(
        tags=["Медиа"],
        summary="Загрузка аудио файла",
        description="Загружает аудио файл и создает MediaFile для последующего enqueue в вещание.",
        request=MediaFileUploadSerializer,
        responses={
            201: MediaFileUploadSerializer,
            400: OpenApiResponse(response=DetailMessageSerializer, description="Ошибка валидации"),
            403: OpenApiResponse(response=DetailMessageSerializer, description="Недостаточно прав"),
        },
    )
    def post(self, request):
        serializer = MediaFileUploadSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            media = serializer.save()
            return Response(MediaFileUploadSerializer(media).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Управление Медиатекой
class MediaFileListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def get(self, request):
        media = MediaFile.objects.filter(
            owner=request.user, is_deleted=False
        ).order_by('-uploaded_at')
        return Response(MediaFileUploadSerializer(media, many=True).data)


class MediaFileDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def delete(self, request, pk):
        media = get_object_or_404(
            MediaFile, pk=pk, owner=request.user, is_deleted=False
        )
        media.is_deleted = True
        media.save(update_fields=['is_deleted'])
        return Response(status=status.HTTP_204_NO_CONTENT)

# Управление плейлистами

class PlaylistListCreateAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def get(self, request):
        playlists = Playlist.objects.filter(owner=request.user)
        return Response(PlayListSerializer(playlists, many=True).data)

    def post(self, request):
        serializer = PlayListSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(owner=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PlaylistDetailAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def get_object(self, pk, user):
        return get_object_or_404(Playlist, pk=pk, owner=user)
    
    def get(self, request, pk):
        playlist = self.get_object(pk, request.user)
        return Response(PlayListSerializer(playlist).data)
    
    def put(self, request, pk):
        playlist = self.get_object(pk, request.user)
        serializer = PlayListSerializer(playlist, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, pk):
        playlist = self.get_object(pk, request.user)
        playlist.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
class PlaylistAddItemAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def post(self, request, pk):
        platlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
        media_id = request.data.get('media_id')
        media = get_object_or_404(MediaFile, pk=media_id, owner=request.user, is_deleted=False)
        next_order = platlist.items.count()
        while platlist.items.filter(order=next_order).exists():
            next_order += 1
        item = PlayListItem.objects.create(playlist=platlist, media=media, order=next_order)
        return Response(PlayListItemSerializer(item).data, status=status.HTTP_201_CREATED)
    

class PlaylistRemoveItemAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def delete(self, request, pk, item_pk):
        playlist = get_object_or_404(Playlist, pk=pk, owner=request.user)
        item = get_object_or_404(PlayListItem, pk=item_pk, playlist=playlist)
        item.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# Вещание
class BroadcastAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def _get_broadcast(self):
        broadcast, _ = Broadcast.objects.get_or_create(pk=1)
        return broadcast

    def get(self, request):
        broadcast = self._get_broadcast()
        data = BroadCastSerializer(broadcast).data

        # Добавляем URL текущего трека
        if broadcast.is_active and broadcast.current_item:
            media = broadcast.current_item.media
            data['stream_url'] = request.build_absolute_uri(media.file.url)
            data['current_track'] = media.name
        else:
            data['stream_url'] = None
            data['current_track'] = None

        return Response(data)

    def patch(self, request):
        broadcast = self._get_broadcast()
        serializer = BroadCastSerializer(broadcast, data=request.data, partial=True)

        if serializer.is_valid():
            # Включаем эфир
            turning_on = request.data.get('is_active') and not broadcast.is_active
            if turning_on:
                playlist = broadcast.current_playlist
                if playlist and playlist.is_shuffle:  # опечатка в модели — is_shufle
                    items = list(playlist.items.all())
                    random.shuffle(items)
                    for i, item in enumerate(items):
                        item.order = i
                        item.save(update_fields=['order'])
                serializer.save(started_at=timezone.now())
            else:
                serializer.save()

            return Response(BroadCastSerializer(broadcast).data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
# Сообщения со стороны host
class MessageListAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def get(self, request):
        messages = Message.objects.exclude(status=Message.Status.DONE)
        return Response(MessageSerializer(messages, many=True).data)


class MessageArchiveAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def get(self, request):
        messages = Message.objects.filter(status=Message.Status.DONE)
        return Response(MessageSerializer(messages, many=True).data)


class MessageStatusAPIView(APIView):
    permission_classes = [IsAuthenticated, IsHost | IsAdmin]

    def patch(self, request, pk):
        message = get_object_or_404(Message, pk=pk)
        new_status = request.data.get('status')

        if new_status not in Message.Status.values:
            return Response(
                {'detail': f'Допустимые статусы: {Message.Status.values}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        message.status = new_status
        message.save(update_fields=['status'])

        # Оповещаем слушателя об изменении статуса его сообщения
        if message.author:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'user_{message.author.id}_messages',
                {
                    'type': 'status_update',
                    'message_id': message.id,
                    'status': new_status
                }
            )

        return Response(MessageSerializer(message).data)


# Блок слушателя

class ListenerBroadcastAPIView(APIView):
    """
    Текущее состояние эфира для слушателя.
    Возвращает stream_url, данные ведущего, текущий трек.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        broadcast, _ = Broadcast.objects.get_or_create(pk=1)
        serializer = BroadcastListenerSerializer(
            broadcast, context={'request': request}
        )
        return Response(serializer.data)


class ListenerPlaylistsAPIView(APIView):
    """
    Список всех плейлистов — слушатель видит плейлисты всех ведущих.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        playlists = Playlist.objects.filter(
            owner__is_deleted=False
        ).order_by('-created_at')
        serializer = PlaylistPublicSerializer(playlists, many=True)
        return Response(serializer.data)
    

class ListenerPlaylistDetailAPIView(APIView):
    """Детали плейлиста — треки внутри"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        playlist = get_object_or_404(
            Playlist, pk=pk, owner__is_deleted=False
        )
        serializer = PlayListSerializer(playlist)
        return Response(serializer.data)

class ListenerMessageListAPIView(APIView):
    """
    Слушатель видит ТОЛЬКО свои сообщения с их статусами.
    Статусы: new (отправлено), in_progress (читает ведущий), done (обработано).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        messages = Message.objects.filter(
            author=request.user
        ).order_by('created_at')
        serializer = MessageListenerSerializer(messages, many=True)
        return Response(serializer.data)
    
class ListenerSendMessageAPIView(APIView):
    """Слушатель отправляет текстовое сообщение ведущему"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        if serializer.is_valid():
            message = Message.objects.create(
                author=request.user,
                text=serializer.validated_data['text'],
                status=Message.Status.NEW
            )

            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync

            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                'host_messages',
                {
                    'type': 'new_message',
                    'message': MessageSerializer(message).data
                }
            )

            return Response(
                MessageListenerSerializer(message).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)