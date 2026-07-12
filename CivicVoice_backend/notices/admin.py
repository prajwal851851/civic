from django.contrib import admin

from notices.models import Notice


@admin.register(Notice)
class NoticeAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "municipality",
        "ward_number",
        "created_by",
        "is_published",
        "is_pinned",
        "expires_at",
        "created_at",
    ]
    list_filter = ["is_published", "is_pinned", "municipality", "created_at"]
    search_fields = ["title", "content", "municipality"]
    readonly_fields = ["created_at", "updated_at"]
    list_editable = ["is_published", "is_pinned"]
