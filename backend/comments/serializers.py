from rest_framework import serializers

from comments.models import Comment


class CommentSerializer(serializers.ModelSerializer):
    author_name = serializers.CharField(
        source="user.full_name", read_only=True
    )
    author_profile_picture = serializers.URLField(
        source="user.profile_picture", read_only=True
    )
    is_edited = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "report",
            "user",
            "author_name",
            "author_profile_picture",
            "parent",
            "content",
            "is_edited",
            "replies",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "report",
            "user",
            "author_name",
            "author_profile_picture",
            "is_edited",
            "replies",
            "created_at",
            "updated_at",
        ]

    def get_is_edited(self, obj):
        diff = abs((obj.updated_at - obj.created_at).total_seconds())
        return diff > 1

    def get_replies(self, obj):
        replies = obj.replies.all()
        if replies:
            return CommentSerializer(
                replies, many=True, context=self.context
            ).data
        return []


class CommentCreateSerializer(serializers.ModelSerializer):
    content = serializers.CharField(max_length=1000)

    class Meta:
        model = Comment
        fields = ["content", "parent"]

    def validate_parent(self, value):
        if value and value.report_id != self.context.get("report_id"):
            raise serializers.ValidationError(
                "Parent comment does not belong to this report."
            )
        if value and value.parent is not None:
            raise serializers.ValidationError(
                "Replies to replies are not allowed. Reply to the top-level comment."
            )
        return value
