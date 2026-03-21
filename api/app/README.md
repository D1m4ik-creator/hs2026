# API Документация (App)

## REST методы

| Метод | URL | Описание |
|---|---|---|
| `GET` | `/api/media/` | Список медиатеки |
| `POST` | `/api/media/upload/` | Загрузить файл |
| `DELETE` | `/api/media/{id}/delete/` | Удалить файл |
| `GET / POST` | `/api/playlists/` | Список / создать плейлист |
| `GET / PATCH / DELETE` | `/api/playlists/{id}/` | Детали / редактировать / удалить |
| `POST` | `/api/playlists/{id}/items/` | Добавить файл в плейлист |
| `DELETE` | `/api/playlists/{id}/items/{item_id}/` | Убрать файл из плейлиста |
| `GET / PATCH` | `/api/broadcast/` | Состояние эфира / управление |
| `GET` | `/api/messages/` | Входящие сообщения |
| `GET` | `/api/messages/archive/` | Архив завершённых |
| `PATCH` | `/api/messages/{id}/status/` | Сменить статус |

## WebSocket вещание

### URL подключения

`ws://<host>/ws/broadcast/`

### Авторизация и права

- Подключение к сокету доступно авторизованным пользователям.
- Управляющие действия (`enqueue`, `play_next`, `track_ended`) доступны ролям `host` или `admin`.

### Действия от фронта

1. Добавить аудио в очередь:

```json
{
  "action": "enqueue",
  "media_file_id": 12
}
```

или:

```json
{
  "action": "enqueue",
  "playlist_item_id": 77
}
```

2. Переключить на следующий трек:

```json
{
  "action": "play_next"
}
```

3. Уведомить о завершении текущего трека:

```json
{
  "action": "track_ended"
}
```

### Событие от сервера (для всех слушателей)

```json
{
  "type": "broadcast_update",
  "media_url": "/media/...",
  "offset": 0,
  "is_active": true,
  "queue_len": 3,
  "current_queue_item_id": 15
}
```

### Что важно фронту

- `offset` — сдвиг воспроизведения (в секундах), нужен для синхронизации новых подключений.
- Если `is_active = false`, сейчас ничего не воспроизводится.
- `queue_len` — сколько треков ещё в очереди.
- При окончании трека фронт должен отправлять `track_ended`, чтобы сервер запустил следующий.
