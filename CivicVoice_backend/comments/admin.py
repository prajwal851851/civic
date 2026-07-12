from django.contrib import admin

from comments.models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["id", "report", "user", "parent", "created_at", "updated_at"]
    list_filter = ["created_at"]
    search_fields = ["content", "user__email", "report__title"]
    readonly_fields = ["created_at", "updated_at"]
