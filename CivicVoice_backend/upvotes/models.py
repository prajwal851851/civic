from django.conf import settings
from django.db import models

from reports.models import Report


class Upvote(models.Model):
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE, related_name="upvotes"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="upvotes",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["report", "user"],
                name="unique_report_user_upvote",
            )
        ]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} upvoted {self.report.title}"
