from rest_framework import serializers

from reports.models import Report


class MapMarkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = [
            "id",
            "title",
            "category",
            "status",
            "latitude",
            "longitude",
            "municipality",
            "ward_number",
        ]
