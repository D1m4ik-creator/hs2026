from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import *
import re

User = get_user_model()
class MeSerializer(serializers.ModelSerializer):
    token = serializers.CharField(read_only=True)
    class Meta:
        model = User
        fields = ['id', 'login', 'full_name', 'roles', 'avatar', 'date_joined']
        
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["login", "full_name", "password", "password_confirm", "avatar"]
        extra_kwargs = {
            'avatar': {'required': False}
        }

    def validate(self, data):
        password = data.get('password')
        password_confirm = data.get('password_confirm')

        if not re.match(r'^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$', password):
            raise serializers.ValidationError({"password": "Пароль должен содержать только латинские буквы, цифры и специальные символы."})
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})
        return data
    
    def create(self, validated_data):

        user = User.objects.create_user(
            login=validated_data.get('login'),
            full_name=validated_data.get('full_name'),
            password=validated_data['password'],
            avatar=validated_data.get('avatar'),
            roles=[User.Role.USER]
        )

        return user
    

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'login', 'full_name', 'roles', 'avatar', 'date_joined']

class UserEditSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['login', 'full_name', "avatar"]


class UserChangePasswordSerializer(serializers.Serializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, data):
        password = data['password']
        password_confirm = data['password_confirm']

        if not re.match(r'^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]+$', password):
            raise serializers.ValidationError({"password": "Пароль должен содержать только латинские буквы, цифры и специальные символы."})
        if password != password_confirm:
            raise serializers.ValidationError({"password_confirm": "Пароли не совпадают."})
        return data
    
    
class AssignRoleSerializer(serializers.Serializer):
    roles = serializers.ListField(
        child=serializers.ChoiceField(choices=User.Role.choices),
    )
    def validate_roles(self, value):
        if not value:
            raise serializers.ValidationError("Нужно выбрать хотя бы одну роль.")
        return value
    

class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text="Refresh токен, который нужно отозвать")


class LoginRequestSerializer(serializers.Serializer):
    login = serializers.CharField()
    password = serializers.CharField()


class LoginSuccessSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class DetailMessageSerializer(serializers.Serializer):
    detail = serializers.CharField()


class MediaFileUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = ['id', 'file', 'name', 'media_type', 'size', 'duration', 'uploaded_at']
        read_only_fields = ['id', 'size', 'uploaded_at']

    def create(self, validated_data):
        request = self.context.get('request')
        return MediaFile.objects.create(
            owner=request.user,
            media_type=validated_data.get('media_type', MediaFile.MediaType.AUDIO),
            name=validated_data.get('name'),
            file=validated_data.get('file'),
            duration=validated_data.get('duration'),
        )


# Плейлист и его элементы
class PlayListItemSerializer(serializers.ModelSerializer):
    media = MediaFileUploadSerializer(read_only=True)

    class Meta:
        model = PlayListItem
        fields = ['id', 'media', 'order']


class PlayListSerializer(serializers.ModelSerializer):
    items = PlayListItemSerializer(many=True, read_only=True)

    class Meta:
        model = Playlist
        fields = ['id', 'name', 'is_loop', 'is_shuffle', 'created_at', 'items']
        read_only_fields = ['created_at']


class BroadCastSerializer(serializers.ModelSerializer):
    class Meta:
        model = Broadcast
        fields = ['id', "is_active", "volume", "current_playlist", "current_item", "started_at"]

class MessageSerializer(serializers.ModelSerializer):
    author_login = serializers.CharField(source='author.login', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'author_login', "text", "status", "created_at"]
        read_only_fields = ['id', 'author_login', 'created_at']


class MessageListenerSerializer(serializers.ModelSerializer):
    """
    Сериализатор для слушателя — видит только свои сообщения.
    """
    class Meta:
        model = Message
        fields = ['id', 'text', 'status', 'created_at']
        read_only_fields = ['status', 'created_at']


class SendMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ['id', 'text', 'created_at', 'status']
        read_only_fields = ['id', 'status', 'created_at']

    def validate_text(self, value):
        if not value.strip():
            raise serializers.ValidationError('Сообщение не может быть пустым.')
        return value.strip()


class PlaylistPublicSerializer(serializers.ModelSerializer):
    """Публичные плейлисты для слушателя"""
    owner_login = serializers.CharField(source='owner.login', read_only=True)
    tracks_count = serializers.SerializerMethodField()

    class Meta:
        model = Playlist
        fields = ['id', 'name', 'owner_login', 'tracks_count', 'created_at']

    def get_tracks_count(self, obj):
        return obj.items.count()


class BroadcastListenerSerializer(serializers.ModelSerializer):
    """Состояние эфира для слушателя"""
    current_track = serializers.SerializerMethodField()
    host_login = serializers.SerializerMethodField()
    stream_url = serializers.SerializerMethodField()

    class Meta:
        model = Broadcast
        fields = [
            'is_active', 'volume',
            'current_track', 'host_login', 'stream_url'
        ]

    def get_current_track(self, obj):
        if obj.current_item:
            return obj.current_item.media.name
        return None

    def get_host_login(self, obj):
        if obj.current_playlist:
            owner = obj.current_playlist.owner
            return {
                'login': owner.login,
                'full_name': owner.full_name,
                'avatar': self.context['request'].build_absolute_uri(owner.avatar.url)
                          if owner.avatar else None
            }
        return None

    def get_stream_url(self, obj):
        if obj.is_active and obj.current_item:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.current_item.media.file.url)
        return None