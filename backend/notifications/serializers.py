from rest_framework import serializers

from notifications.models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    actor_name = serializers.SerializerMethodField()
    report_id = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = [
            "id",
            "type",
            "title",
            "message",
            "is_read",
            "created_at",
            "actor_name",
            "report_id",
        ]
        read_only_fields = fields

    def get_actor_name(self, obj):
        return obj.actor.full_name if obj.actor else None

    def get_report_id(self, obj):
        return obj.report.id if obj.report else None
