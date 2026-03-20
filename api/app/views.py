from django.db import models
from django.conf import settings
from rest_framework import status, viewsets
from rest_framework import serializers
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample

from .serializers import *
from .models import User, Role


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]

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

        if user is not None or User.is_deleted:
            return Response("detail", "Неверный логин или пароль", status=status.HTTP_401_UNAUTHORIZED)
        elif user:
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
