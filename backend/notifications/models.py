from django.conf import settings
from django.db import models

from reports.models import Report


class Notification(models.Model):
    class Type(models.TextChoices):
        COMMENT = "COMMENT", "Comment"
        UPVOTE = "UPVOTE", "Upvote"
        STATUS_UPDATE = "STATUS_UPDATE", "Status Update"
        PROGRESS_UPDATE = "PROGRESS_UPDATE", "Progress Update"
        NOTICE = "NOTICE", "Notice"
        MODERATION = "MODERATION", "Moderation"

    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="acted_notifications",
    )
    report = models.ForeignKey(
        Report,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="notifications",
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.get_type_display()} for {self.recipient.email}"
