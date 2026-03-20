from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from .models import User
import re

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["login", "full_name", "password", "password_confirm", "avatar"]

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
        password = serializers.CharField(write_only=True)
        password_confirm = serializers.CharField(write_only=True)

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



