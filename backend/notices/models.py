from django.db import models

from accounts.models import User


class Notice(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    municipality = models.CharField(max_length=255, default="")
    ward_number = models.PositiveIntegerField(null=True, blank=True)
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="notices"
    )
    is_published = models.BooleanField(default=True)
    is_pinned = models.BooleanField(default=False)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-is_pinned", "-created_at"]

    def __str__(self):
        return self.title
