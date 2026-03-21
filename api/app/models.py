from django.db import models
from django.conf import settings
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
import os

login_validator = RegexValidator(
    regex=r'^[a-zA-Z]+$',
    message='Логин должен содержать только латинские буквы.'
)

fullname_validator = RegexValidator(
    regex=r'^[а-яА-ЯёЁ\s\-]+$',
    message='ФИО должно содержать только русские буквы.'
)

class UserManager(BaseUserManager):
    def create_user(self, login, full_name, password=None, **extra_fields):
        if not login:
            raise ValueError('Логин обязателен')
        user = self.model(login=login, full_name=full_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, login, full_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Суперпользователь должен иметь is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Суперпользователь должен иметь is_superuser=True.')

        return self.create_user(login, full_name, password, **extra_fields)
    

class User(AbstractUser):
    class Role(models.TextChoices):
        USER = 'user', 'Пользователь'
        HOST = 'host', 'Ведущий'
        ADMIN = 'admin', 'Администратор'

    username = None
    email = None
    first_name = None
    last_name = None

    login = models.CharField(max_length=150, unique=True, validators=[login_validator])
    full_name = models.CharField(max_length=255, validators=[fullname_validator])
    roles = ArrayField(models.CharField(max_length=20, choices=Role.choices), blank=True, default=list)
    is_deleted = models.BooleanField(default=False)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    objects = UserManager()

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['full_name']

    def soft_delete(self):
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])

    def __str__(self):
        return self.login
                                     
def media_upload_path(instance, filename):
    return f'media/user_{instance.owner.id}/{filename}'


def validate_audio_file(file):
    allowed = ['.mp3', '.wav', '.ogg']
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in allowed:
        raise ValidationError(f'Допустимые форматы: MP3, WAV, OGG.')
    if file.size > 50 * 1024 * 1024:  # 50 MB
        raise ValidationError('Максимальный размер файла — 50 МБ.')
    
class MediaFile(models.Model):
    class MediaType(models.TextChoices):
        AUDIO = 'audio', 'Аудио'
        VIDEO = 'video', 'Видео'

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='media_files')
    file = models.FileField(upload_to=media_upload_path, validators=[validate_audio_file])
    name = models.CharField(max_length=255)
    media_type = models.CharField(max_length=10, choices=MediaType.choices)
    size = models.PositiveIntegerField()
    duration = models.FloatField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    is_deleted = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.file:
            self.size = self.file.size
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.media_type}) - {self.owner.login}"
    
class Playlist(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='playlists')
    name = models.CharField(max_length=255)
    is_loop = models.BooleanField(default=False)
    is_shuffle = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.owner.login}"
    
class PlayListItem(models.Model):
    playlist = models.ForeignKey(
        Playlist, on_delete=models.CASCADE, related_name='items'
    )
    media = models.ForeignKey(
        MediaFile, on_delete=models.CASCADE, related_name='playlist_items'
    )
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ['playlist', 'order']

    def __str__(self):
        return f'{self.playlist.name} — {self.order}. {self.media.name}'


class Broadcast(models.Model):
    is_active = models.BooleanField(default=False)
    volume = models.FloatField(default=1.0)
    current_playlist = models.ForeignKey(
        Playlist, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='broadcasts'
    )
    current_item = models.ForeignKey(
        PlayListItem, on_delete=models.SET_NULL,
        null=True, blank=True
    )
    started_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['id'], name='single_broadcast')
        ]


class BroadcastQueueItem(models.Model):
    class Status(models.TextChoices):
        QUEUED = 'queued', 'В очереди'
        PLAYING = 'playing', 'Играет'
        DONE = 'done', 'Завершен'

    media = models.ForeignKey(
        MediaFile, on_delete=models.CASCADE, related_name='broadcast_queue_items'
    )
    added_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='added_broadcast_items'
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    enqueued_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['enqueued_at', 'id']

    def __str__(self):
        return f'{self.media.name} [{self.status}]'


class Message(models.Model):
    class Status(models.TextChoices):
        NEW = 'new', 'Новый'
        IN_PROGRESS = 'in_progress', 'В работе'
        DONE = 'done', 'Завершено'

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='messages'
    )
    text = models.TextField(blank=True)
    # voice_file = models.FileField(
    #     upload_to='messages/voice/', null=True, blank=True
    # )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.NEW
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'Сообщение от {self.author} — {self.status}'
