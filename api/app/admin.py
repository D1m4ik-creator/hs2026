from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, MediaFile, Playlist, PlayListItem, Broadcast, BroadcastQueueItem, Message

# --- Настройка заголовка и интерфейса ---
admin.site.site_header = 'Панель управления радиостанцией'
admin.site.index_title = 'Модули системы'
admin.site.site_title = 'Администрирование'

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Подраздел «Управление пользователями»
    """
    # Убираем стандартные поля, которых нет в модели
    fieldsets = (
        (None, {'fields': ('login', 'password')}),
        ('Персональная информация', {'fields': ('full_name', 'avatar')}),
        ('Права доступа', {'fields': ('roles', 'is_active', 'is_staff', 'is_superuser', 'is_deleted')}),
        ('Даты', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('login', 'full_name', 'password', 'roles'),
        }),
    )

    # Настройка таблицы списка (Заголовки по ТЗ)
    list_display = ('login', 'full_name', 'display_roles', 'date_joined', 'account_actions')
    
    # Фильтрация и поиск
    list_filter = ('roles', 'is_staff', 'is_active', 'date_joined')
    search_fields = ('login', 'full_name')
    ordering = ('-date_joined',)
    
    # Специфические настройки
    filter_horizontal = ()
    list_per_page = 20

    # Отображение ролей из ArrayField
    @admin.display(description='Роль')
    def display_roles(self, obj):
        if not obj.roles:
            return "—"
        return ", ".join([dict(User.Role.choices).get(role, role) for role in obj.roles])

    # Колонка "Действия"
    @admin.display(description='Действия')
    def account_actions(self, obj):
        return format_html(
            '<a class="button" href="{}">Изменить</a>&nbsp;'
            '<a class="button" style="background-color: var(--delete-button-bg)" href="{}">Удалить</a>',
            f"{obj.pk}/change/",
            f"{obj.pk}/delete/"
        )

    class Media:
        # Добавляем CSS для имитации "перехода между модулями" с пиктограммами
        # В реальном проекте это лучше вынести в статику
        css = {
            'all': ('admin/css/custom_admin.css',)
        }

# --- Остальные модели для полноты структуры ---

@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'media_type', 'size', 'uploaded_at')
    list_filter = ('media_type', 'uploaded_at')
    search_fields = ('name', 'owner__login')

@admin.register(Playlist)
class PlaylistAdmin(admin.ModelAdmin):
    list_display = ('name', 'owner', 'created_at')
    search_fields = ('name', 'owner__login')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('author', 'status', 'created_at', 'text_excerpt')
    list_filter = ('status', 'created_at')
    
    def text_excerpt(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_excerpt.short_description = 'Текст сообщения'

# Регистрация системных настроек вещания
admin.site.register(Broadcast)
admin.site.register(BroadcastQueueItem)