from cloudinary.models import CloudinaryField
from django.db import models

from accounts.models import User


class Report(models.Model):
    class Category(models.TextChoices):
        ROADS = "roads", "Roads"
        STREET_LIGHTS = "street_lights", "Street Lights"
        GARBAGE = "garbage", "Garbage"
        WATER = "water", "Water"
        SEWAGE = "sewage", "Sewage"
        ELECTRICITY = "electricity", "Electricity"
        PARKS = "parks", "Parks"
        NOISE = "noise", "Noise"
        OTHER = "other", "Other"

    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_REVIEW = "in_review", "In Review"
        RESOLVED = "resolved", "Resolved"
        REJECTED = "rejected", "Rejected"

    class AIStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        APPROVED = "approved", "Approved"
        FLAGGED = "flagged", "Flagged"

    citizen = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="reports"
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(
        max_length=50, choices=Category.choices, db_index=True
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    municipality = models.CharField(max_length=255)
    ward_number = models.PositiveIntegerField()
    address = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.OPEN, db_index=True
    )
    ai_status = models.CharField(
        max_length=20,
        choices=AIStatus.choices,
        default=AIStatus.PENDING,
        db_index=True,
    )
    visibility = models.BooleanField(default=True)
    progress_notes = models.TextField(blank=True, default="")
    moderation_note = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["citizen", "status"]),
            models.Index(fields=["municipality", "ward_number"]),
            models.Index(fields=["municipality"]),
            models.Index(fields=["ward_number"]),
            models.Index(fields=["visibility"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"


class ReportImage(models.Model):
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE, related_name="images"
    )
    image = CloudinaryField("image", max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Image {self.id} for Report {self.report_id}"


class ReportVideo(models.Model):
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE, related_name="videos"
    )
    video = CloudinaryField("video", resource_type="video", max_length=500)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["uploaded_at"]

    def __str__(self):
        return f"Video {self.id} for Report {self.report_id}"
