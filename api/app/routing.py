from django.urls import path

from .consumers import BroadcastConsumer


websocket_urlpatterns = [
    path("ws/broadcast/", BroadcastConsumer.as_asgi()),
]
