from django.contrib import admin

from upvotes.models import Upvote


@admin.register(Upvote)
class UpvoteAdmin(admin.ModelAdmin):
    list_display = ["report", "user", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["report__title", "user__email"]
