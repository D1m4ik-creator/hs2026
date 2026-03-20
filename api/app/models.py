from django.db import models, AbstractUser
from django.core.validators import RegexValidator


login_validator = RegexValidator(
    regex=r'^[a-zA-Z]+$',
    message='Логин должен содержать только латинские буквы.'
)

fullname_validator = RegexValidator(
    regex=r'^[а-яА-ЯёЁ\s\-]+$',
    message='ФИО должно содержать только русские буквы.'
)


class Role(models.Model):
    ROLE_CHOICES = [
        ('user', 'Пользователь'),
        ('host', 'Ведущий'),
        ('admin', 'Администратор'),
    ]
    name = models.CharField(max_length=20, choices=ROLE_CHOICES, unique=True)

    def __str__(self):
        return self.name


class User(AbstractUser):
    username = None
    email = None
    first_name = None
    last_name = None

    login = models.CharField(max_length=150, unique=True, validators=[login_validator])
    full_name = models.CharField(max_length=255, validators=[fullname_validator])
    roles = models.ManyToManyField(Role, blank=True, related_name='users')
    is_deleted = models.BooleanField(default=False)
    data_registration = models.DateTimeField(auto_now_add=True)

    def soft_delete(self):
        self.is_deleted = True
        self.save(update_fields=['is_deleted'])

    def __str__(self):
        return self.login
                                     