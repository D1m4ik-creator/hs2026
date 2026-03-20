from django.db import models, AbstractUser


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

    login = models.CharField(max_length=150, unique=True)
    full_name = models.CharField(max_length=255)
    roles = models.ManyToManyField(Role, blank=True, related_name='users')
    is_deleted = models.BooleanField(default=False)
    data_registration = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.login
    