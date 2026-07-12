from rest_framework import serializers

from notices.models import Notice


class NoticeSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(
        source="created_by.full_name", read_only=True
    )

    class Meta:
        model = Notice
        fields = [
            "id",
            "title",
            "content",
            "municipality",
            "ward_number",
            "is_pinned",
            "expires_at",
            "created_at",
            "updated_at",
            "created_by_name",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
