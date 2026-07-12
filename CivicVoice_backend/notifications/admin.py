from django.contrib import admin

from notifications.models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = [
        "recipient",
        "actor",
        "type",
        "title",
        "is_read",
        "created_at",
    ]
    list_filter = ["type", "is_read", "created_at"]
    search_fields = [
        "recipient__email",
        "actor__email",
        "title",
        "message",
    ]
    readonly_fields = [
        "recipient",
        "actor",
        "report",
        "type",
        "title",
        "message",
        "is_read",
        "created_at",
    ]
