from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from comments.models import Comment
from notifications.models import Notification
from reports.models import Report
from upvotes.models import Upvote


@receiver(pre_save, sender=Report, dispatch_uid="report_pre_save_tracker")
def track_report_changes(sender, instance, **kwargs):
    if instance.pk:
        try:
            old = Report.objects.get(pk=instance.pk)
            instance._old_status = old.status
            instance._old_progress_notes = old.progress_notes
        except Report.DoesNotExist:
            instance._old_status = instance.status
            instance._old_progress_notes = instance.progress_notes
    else:
        instance._old_status = instance.status
        instance._old_progress_notes = instance.progress_notes


@receiver(post_save, sender=Comment, dispatch_uid="comment_notification")
def create_comment_notification(sender, instance, created, **kwargs):
    if not created:
        return
    report = instance.report
    recipient = report.citizen
    if instance.user == recipient:
        return
    Notification.objects.create(
        recipient=recipient,
        actor=instance.user,
        report=report,
        type=Notification.Type.COMMENT,
        title="New Comment",
        message=f"{instance.user.full_name} commented on your report.",
    )


@receiver(post_save, sender=Upvote, dispatch_uid="upvote_notification")
def create_upvote_notification(sender, instance, created, **kwargs):
    if not created:
        return
    report = instance.report
    recipient = report.citizen
    if instance.user == recipient:
        return
    Notification.objects.create(
        recipient=recipient,
        actor=instance.user,
        report=report,
        type=Notification.Type.UPVOTE,
        title="New Upvote",
        message=f"{instance.user.full_name} upvoted your report.",
    )


@receiver(post_save, sender=Report, dispatch_uid="report_status_notification")
def create_status_update_notification(sender, instance, created, **kwargs):
    if created:
        return
    old_status = getattr(instance, "_old_status", None)
    if old_status is None or old_status == instance.status:
        return
    Notification.objects.create(
        recipient=instance.citizen,
        actor=None,
        report=instance,
        type=Notification.Type.STATUS_UPDATE,
        title="Report Status Updated",
        message=f"Your report status changed to {instance.get_status_display()}.",
    )


@receiver(post_save, sender=Report, dispatch_uid="report_progress_notification")
def create_progress_update_notification(sender, instance, created, **kwargs):
    if created:
        return
    old_notes = getattr(instance, "_old_progress_notes", None)
    if old_notes is None or old_notes == instance.progress_notes:
        return
    Notification.objects.create(
        recipient=instance.citizen,
        actor=None,
        report=instance,
        type=Notification.Type.PROGRESS_UPDATE,
        title="Progress Update",
        message="An official added a progress update to your report.",
    )
