from django.db.models import Q
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import User
from notices.models import Notice
from notifications.models import Notification


@receiver(post_save, sender=Notice, dispatch_uid="notice_notification")
def create_notice_notifications(sender, instance, created, **kwargs):
    if not created or not instance.is_published:
        return
    municipality = (instance.municipality or "Kathmandu").strip()
    citizens = User.objects.filter(role=User.Role.CITIZEN).filter(
        Q(municipality__iexact=municipality) | Q(municipality="") | Q(municipality__isnull=True)
    )
    if instance.ward_number is not None:
        citizens = citizens.filter(ward_number=instance.ward_number)
    for citizen in citizens.iterator():
        Notification.objects.create(
            recipient=citizen,
            actor=instance.created_by,
            type=Notification.Type.NOTICE,
            title="New Notice",
            message=f'"{instance.title}" — {instance.content[:200]}',
        )
