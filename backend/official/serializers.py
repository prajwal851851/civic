from rest_framework import serializers

from reports.models import Report


class DashboardReportSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source="citizen.full_name", read_only=True)

    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "category",
            "status",
            "municipality",
            "ward_number",
            "citizen_name",
            "visibility",
            "created_at",
        ]
