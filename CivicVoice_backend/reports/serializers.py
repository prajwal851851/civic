from cloudinary import uploader
from rest_framework import serializers

from reports.models import Report, ReportImage, ReportVideo

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024
MAX_VIDEO_SIZE = 50 * 1024 * 1024
MAX_IMAGES = 5
MAX_VIDEOS = 2


class ReportImageSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ReportImage
        fields = ["id", "image", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]

    def get_image(self, obj):
        return obj.image.build_url(secure=True)


class ReportVideoSerializer(serializers.ModelSerializer):
    video = serializers.SerializerMethodField()

    class Meta:
        model = ReportVideo
        fields = ["id", "video", "uploaded_at"]
        read_only_fields = ["id", "uploaded_at"]

    def get_video(self, obj):
        return obj.video.build_url(secure=True)


class ReportSerializer(serializers.ModelSerializer):
    images = ReportImageSerializer(many=True, read_only=True)
    videos = ReportVideoSerializer(many=True, read_only=True)
    uploaded_images = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )
    uploaded_videos = serializers.ListField(
        child=serializers.FileField(),
        write_only=True,
        required=False,
    )
    citizen_name = serializers.CharField(
        source="citizen.full_name", read_only=True
    )
    total_upvotes = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "citizen",
            "citizen_name",
            "title",
            "description",
            "category",
            "latitude",
            "longitude",
            "municipality",
            "ward_number",
            "address",
            "status",
            "ai_status",
            "visibility",
            "progress_notes",
            "moderation_note",
            "images",
            "videos",
            "uploaded_images",
            "uploaded_videos",
            "total_upvotes",
            "has_upvoted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "citizen",
            "citizen_name",
            "status",
            "ai_status",
            "visibility",
            "progress_notes",
            "moderation_note",
            "total_upvotes",
            "has_upvoted",
            "created_at",
            "updated_at",
        ]

    def get_total_upvotes(self, obj):
        return getattr(obj, "total_upvotes", obj.upvotes.count())

    def get_has_upvoted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if hasattr(obj, "has_upvoted"):
                return obj.has_upvoted
            return obj.upvotes.filter(user=request.user).exists()
        return False

    def validate_uploaded_images(self, value):
        if not value:
            return value
        if len(value) > MAX_IMAGES:
            raise serializers.ValidationError(
                f"Maximum {MAX_IMAGES} images allowed."
            )
        for f in value:
            if f.content_type not in ALLOWED_IMAGE_TYPES:
                raise serializers.ValidationError(
                    f"Invalid image type '{f.content_type}'. "
                    f"Allowed: jpg, jpeg, png, webp."
                )
            if f.size > MAX_IMAGE_SIZE:
                raise serializers.ValidationError(
                    f"Image '{f.name}' exceeds 10 MB."
                )
        return value

    def validate_uploaded_videos(self, value):
        if not value:
            return value
        if len(value) > MAX_VIDEOS:
            raise serializers.ValidationError(
                f"Maximum {MAX_VIDEOS} videos allowed."
            )
        for f in value:
            if f.content_type not in ALLOWED_VIDEO_TYPES:
                raise serializers.ValidationError(
                    f"Invalid video type '{f.content_type}'. "
                    f"Allowed: mp4, mov, webm."
                )
            if f.size > MAX_VIDEO_SIZE:
                raise serializers.ValidationError(
                    f"Video '{f.name}' exceeds 50 MB."
                )
        return value

    def create(self, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", [])
        uploaded_videos = validated_data.pop("uploaded_videos", [])
        report = Report.objects.create(**validated_data)
        for f in uploaded_images:
            ReportImage.objects.create(report=report, image=f)
        for f in uploaded_videos:
            ReportVideo.objects.create(report=report, video=f)
        return report

    def update(self, instance, validated_data):
        uploaded_images = validated_data.pop("uploaded_images", None)
        uploaded_videos = validated_data.pop("uploaded_videos", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if uploaded_images is not None:
            if len(uploaded_images) > MAX_IMAGES:
                raise serializers.ValidationError(
                    f"Maximum {MAX_IMAGES} images allowed."
                )
            _delete_cloudinary_resources(instance.images.all())
            instance.images.all().delete()
            for f in uploaded_images:
                ReportImage.objects.create(report=instance, image=f)
        if uploaded_videos is not None:
            if len(uploaded_videos) > MAX_VIDEOS:
                raise serializers.ValidationError(
                    f"Maximum {MAX_VIDEOS} videos allowed."
                )
            _delete_cloudinary_resources(instance.videos.all())
            instance.videos.all().delete()
            for f in uploaded_videos:
                ReportVideo.objects.create(report=instance, video=f)
        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)
        for img in data.get("images", []):
            if not isinstance(img.get("image"), str):
                img["image"] = ""
        for vid in data.get("videos", []):
            if not isinstance(vid.get("video"), str):
                vid["video"] = ""
        return data


def _delete_cloudinary_resources(media_qs):
    for item in media_qs:
        try:
            public_id = str(item.image) if hasattr(item, "image") else str(item.video)
            if public_id:
                uploader.destroy(public_id)
        except Exception:
            pass


class StatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Report.Status.choices)

    def validate_status(self, value):
        report = self.context.get("report")
        if not report:
            return value
        valid_transitions = {
            Report.Status.OPEN: [Report.Status.IN_REVIEW, Report.Status.REJECTED],
            Report.Status.IN_REVIEW: [Report.Status.RESOLVED, Report.Status.REJECTED],
            Report.Status.RESOLVED: [],
            Report.Status.REJECTED: [],
        }
        allowed = valid_transitions.get(report.status, [])
        if value not in allowed:
            raise serializers.ValidationError(
                f"Cannot transition from {report.status} to {value}."
            )
        return value


class ProgressNoteSerializer(serializers.Serializer):
    note = serializers.CharField()


class FeedReportSerializer(serializers.ModelSerializer):
    citizen_name = serializers.CharField(source="citizen.full_name", read_only=True)
    citizen_profile_picture = serializers.URLField(
        source="citizen.profile_picture", read_only=True
    )
    images = ReportImageSerializer(many=True, read_only=True)
    videos = ReportVideoSerializer(many=True, read_only=True)
    total_upvotes = serializers.SerializerMethodField()
    total_comments = serializers.SerializerMethodField()
    has_upvoted = serializers.SerializerMethodField()

    class Meta:
        model = Report
        fields = [
            "id",
            "citizen",
            "citizen_name",
            "citizen_profile_picture",
            "title",
            "description",
            "category",
            "latitude",
            "longitude",
            "municipality",
            "ward_number",
            "address",
            "status",
            "images",
            "videos",
            "total_upvotes",
            "total_comments",
            "has_upvoted",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_total_upvotes(self, obj):
        return getattr(obj, "total_upvotes", obj.upvotes.count())

    def get_total_comments(self, obj):
        return getattr(obj, "total_comments", obj.comments.count())

    def get_has_upvoted(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            if hasattr(obj, "has_upvoted"):
                return obj.has_upvoted
            return obj.upvotes.filter(user=request.user).exists()
        return False
