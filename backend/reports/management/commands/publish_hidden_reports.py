"""Publish demo reports that were left hidden — does not touch real citizen submissions."""

from django.core.management.base import BaseCommand

from reports.models import Report

DEMO_DOMAIN = "demo.civicvoice.app"


class Command(BaseCommand):
    help = "Set visibility=True on demo-domain reports only (for seeded demo data)."

    def handle(self, *args, **options):
        updated = (
            Report.objects.filter(
                visibility=False,
                citizen__email__endswith=f"@{DEMO_DOMAIN}",
            )
            .exclude(status=Report.Status.REJECTED)
            .update(visibility=True, ai_status=Report.AIStatus.APPROVED)
        )
        self.stdout.write(self.style.SUCCESS(f"Published {updated} demo report(s)."))
