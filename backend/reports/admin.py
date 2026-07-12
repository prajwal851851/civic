from django.contrib import admin

from reports.models import Report, ReportImage, ReportVideo


class ReportImageInline(admin.TabularInline):
    model = ReportImage
    extra = 0
    readonly_fields = ["uploaded_at"]


class ReportVideoInline(admin.TabularInline):
    model = ReportVideo
    extra = 0
    readonly_fields = ["uploaded_at"]


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = [
        "title",
        "citizen",
        "category",
        "status",
        "ai_status",
        "municipality",
        "ward_number",
        "created_at",
    ]
    list_filter = ["status", "ai_status", "category", "municipality"]
    search_fields = ["title", "description", "citizen__email"]
    readonly_fields = ["created_at", "updated_at"]
    inlines = [ReportImageInline, ReportVideoInline]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("citizen", "title", "description")}),
        ("Category", {"fields": ("category",)}),
        (
            "Location",
            {
                "fields": (
                    "latitude",
                    "longitude",
                    "municipality",
                    "ward_number",
                    "address",
                )
            },
        ),
        (
            "Status",
            {"fields": ("status", "ai_status", "visibility", "progress_notes")},
        ),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )


@admin.register(ReportImage)
class ReportImageAdmin(admin.ModelAdmin):
    list_display = ["id", "report", "uploaded_at"]
    readonly_fields = ["uploaded_at"]


@admin.register(ReportVideo)
class ReportVideoAdmin(admin.ModelAdmin):
    list_display = ["id", "report", "uploaded_at"]
    readonly_fields = ["uploaded_at"]
