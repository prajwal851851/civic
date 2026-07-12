from datetime import timedelta

from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        extra_fields.setdefault("is_active", True)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    class Role(models.TextChoices):
        CITIZEN = "citizen", "Citizen"
        OFFICIAL = "official", "Official"

    username = models.CharField(max_length=50, unique=True, null=True, blank=True, db_index=True)
    email = models.EmailField(unique=True, db_index=True)
    full_name = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=20, blank=True, default="")
    municipality = models.CharField(max_length=255, blank=True, default="")
    ward_number = models.PositiveIntegerField(null=True, blank=True)
    profile_picture = models.URLField(max_length=500, blank=True, default="")
    cover_photo = models.URLField(max_length=500, blank=True, default="")
    bio = models.TextField(blank=True, default="")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CITIZEN)
    reputation_points = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    is_deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.full_name} ({self.email})"


class ExtraEmail(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="extra_emails")
    email = models.EmailField()
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = [["user", "email"]]
        verbose_name_plural = "Extra emails"

    def __str__(self):
        return f"{self.email} ({self.user.email})"


class PasswordReset(models.Model):
    email = models.EmailField()
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_expired(self):
        return timezone.now() > self.created_at + timedelta(minutes=15)

    def __str__(self):
        return f"{self.email} - {self.code}"
