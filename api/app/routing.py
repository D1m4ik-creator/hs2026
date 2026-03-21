from django.urls import path

from .consumers import BroadcastConsumer, MessageConsumer


websocket_urlpatterns = [
    path("ws/broadcast/", BroadcastConsumer.as_asgi()),
    path("ws/messages/", MessageConsumer.as_asgi()),
]
