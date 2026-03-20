from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.contrib.postgres.fields import ArrayField

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

    objects = UserManager()

    USERNAME_FIELD = 'login'
    REQUIRED_FIELDS = ['full_name']

    def soft_delete(self):
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])

    def __str__(self):
        return self.login
                                     
