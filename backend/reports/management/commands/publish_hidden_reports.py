"""Publish any non-rejected reports that were left hidden by the old create flow."""

from django.core.management.base import BaseCommand

from reports.models import Report


class Command(BaseCommand):
    help = "Set visibility=True on open/in_review/resolved reports so officials and the feed can see them."

    def handle(self, *args, **options):
        updated = (
            Report.objects.filter(visibility=False)
            .exclude(status=Report.Status.REJECTED)
            .update(visibility=True, ai_status=Report.AIStatus.APPROVED)
        )
        self.stdout.write(self.style.SUCCESS(f"Published {updated} previously hidden report(s)."))
