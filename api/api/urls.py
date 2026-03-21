from django.contrib import admin
from django.urls import path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenVerifyView
)
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from app.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    # Токены для авторизации SimpleJWT и кастомной регистрации
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),# Обновление access токена с помощью refresh токена
    path('api/token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path("api/register/", RegisterAPIView.as_view(), name="register"), # Регистрация
    path("api/logout/", LogoutAPIView.as_view(), name="logout"), # Выход
    path("api/login/", LoginAPIView.as_view(), name="login"), # Вход
    path("api/media/upload/", MediaFileUploadAPIView.as_view(), name="media_upload"), # Загрузка аудио
    
    # Текущий пользователь
    path("api/me/", MeView.as_view(), name="me"),

    # Медиатека
    path('api/media/', MediaFileListAPIView.as_view()),
    path('api/media/upload/', MediaFileUploadAPIView.as_view()),
    path('api/media/<int:pk>/delete/', MediaFileDeleteAPIView.as_view()),

    # Плейлисты
    path('api/playlists/', PlaylistListCreateAPIView.as_view()),
    path('api/playlists/<int:pk>/', PlaylistDetailAPIView.as_view()),
    path('api/playlists/<int:pk>/items/', PlaylistAddItemAPIView.as_view()),
    path('api/playlists/<int:pk>/items/<int:item_pk>/', PlaylistRemoveItemAPIView.as_view()),

    # Эфир
    path('api/broadcast/', BroadcastAPIView.as_view()),

    # Сообщения ведущего
    path('api/messages/', MessageListAPIView.as_view()),
    path('api/messages/archive/', MessageArchiveAPIView.as_view()),
    path('api/messages/<int:pk>/status/', MessageStatusAPIView.as_view()),

    # Документация
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
