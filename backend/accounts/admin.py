from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from accounts.models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = [
        "email",
        "full_name",
        "role",
        "is_verified",
        "is_active",
        "created_at",
    ]
    list_filter = ["role", "is_verified", "is_active"]
    search_fields = ["email", "full_name"]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal Info", {"fields": ("full_name", "phone_number", "bio")}),
        ("Location", {"fields": ("municipality", "ward_number")}),
        (
            "Media",
            {"fields": ("profile_picture", "cover_photo")},
        ),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Role & Status", {"fields": ("role", "is_verified", "reputation_points")}),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )

    add_fieldsets = (
        (
            None,
            {
                "classes": ("wide",),
                "fields": (
                    "email",
                    "full_name",
                    "password1",
                    "password2",
                    "role",
                ),
            },
        ),
    )
