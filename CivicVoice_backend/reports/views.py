import math

from cloudinary import uploader
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import BooleanField, Count, Exists, F, OuterRef, Q, Value
from django.db.models.fields import DateField

from rest_framework import generics, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from notifications.models import Notification

from reports.models import Report
from reports.permissions import IsCitizen, IsOfficial, IsReportOwner
from reports.serializers import (
    FeedReportSerializer,
    ProgressNoteSerializer,
    ReportSerializer,
    StatusUpdateSerializer,
)
from upvotes.models import Upvote


class ReportViewSet(viewsets.ModelViewSet):
    queryset = Report.objects.select_related("citizen").all()
    serializer_class = ReportSerializer
    parser_classes = [JSONParser, FormParser, MultiPartParser]

    def perform_destroy(self, instance):
        for img in instance.images.all():
            try:
                uploader.destroy(str(img.image.public_id))
            except Exception:
                pass
        for vid in instance.videos.all():
            try:
                uploader.destroy(str(vid.video.public_id))
            except Exception:
                pass
        instance.delete()

    def get_serializer_data(self, request):
        if request.FILES:
            data = request.POST.copy()
            for field in ("uploaded_images", "uploaded_videos"):
                files = request.FILES.getlist(field)
                if files:
                    data.setlist(field, files)
            return data
        return request.data

    def create(self, request, *args, **kwargs):
        data = self.get_serializer_data(request)
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(
            serializer.data, status=status.HTTP_201_CREATED, headers=headers
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        data = self.get_serializer_data(request)
        serializer = self.get_serializer(
            instance, data=data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    def get_permissions(self):
        if self.action in ("upvote", "list_upvotes"):
            permission_classes = [IsAuthenticated]
        elif self.action in ("create",):
            permission_classes = [IsAuthenticated, IsCitizen]
        elif self.action in ("update", "partial_update", "destroy"):
            permission_classes = [IsAuthenticated, IsCitizen, IsReportOwner]
        elif self.action in ("status", "progress", "moderate", "pending_moderation"):
            permission_classes = [IsAuthenticated, IsOfficial]
        else:
            permission_classes = [IsAuthenticated]
        return [p() for p in permission_classes]

    def get_queryset(self):
        user = self.request.user
        qs = Report.objects.select_related("citizen").annotate(
            total_upvotes=Count("upvotes", distinct=True),
            has_upvoted=Exists(
                Upvote.objects.filter(report=OuterRef("pk"), user=user)
            ),
        )
        if user.role == "official":
            return qs
        return qs.filter(citizen=user) | qs.filter(visibility=True)

    def perform_create(self, serializer):
        serializer.save(citizen=self.request.user, visibility=False)
        User.objects.filter(pk=self.request.user.pk).update(
            reputation_points=F("reputation_points") + 2
        )

    @action(detail=False, methods=["get"])
    def my(self, request):
        qs = (
            Report.objects.filter(citizen=request.user)
            .select_related("citizen")
            .annotate(
                total_upvotes=Count("upvotes", distinct=True),
                has_upvoted=Exists(
                    Upvote.objects.filter(
                        report=OuterRef("pk"), user=request.user
                    )
                ),
            )
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post", "delete"], url_path="upvote")
    def upvote(self, request, pk=None):
        report = self.get_object()
        user = request.user

        if request.method == "POST":
            _, created = Upvote.objects.get_or_create(
                report=report, user=user
            )
            if not created:
                return Response(
                    {"detail": "You have already upvoted this report."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            return Response(
                {"detail": "Upvote added."},
                status=status.HTTP_201_CREATED,
            )

        deleted, _ = Upvote.objects.filter(
            report=report, user=user
        ).delete()
        if not deleted:
            return Response(
                {"detail": "You have not upvoted this report."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["get"], url_path="upvotes")
    def list_upvotes(self, request, pk=None):
        report = self.get_object()
        upvotes_qs = report.upvotes.select_related("user").values(
            "user_id",
            "user__full_name",
            "user__profile_picture",
            "created_at",
        )
        return Response({"count": upvotes_qs.count(), "results": list(upvotes_qs)})

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        report = self.get_object()
        old_status = report.status
        serializer = StatusUpdateSerializer(
            data=request.data, context={"report": report}
        )
        serializer.is_valid(raise_exception=True)
        new_status = serializer.validated_data["status"]
        report.status = new_status
        report.save(update_fields=["status", "updated_at"])

        points_map = {
            Report.Status.IN_REVIEW: 50,
            Report.Status.RESOLVED: 100,
        }
        if old_status != new_status and new_status in points_map:
            User.objects.filter(pk=report.citizen_id).update(
                reputation_points=F("reputation_points") + points_map[new_status]
            )

        return Response(
            ReportSerializer(report, context={"request": request}).data
        )

    @action(detail=True, methods=["post"])
    def progress(self, request, pk=None):
        report = self.get_object()
        serializer = ProgressNoteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        note = serializer.validated_data["note"]
        timestamp = report.updated_at.isoformat()
        entry = f"[{timestamp}] {note}"
        if report.progress_notes:
            report.progress_notes += "\n" + entry
        else:
            report.progress_notes = entry
        report.save(update_fields=["progress_notes", "updated_at"])
        return Response(
            ReportSerializer(report, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["patch"])
    def moderate(self, request, pk=None):
        from django.utils import timezone

        report = self.get_object()
        action = request.data.get("action")
        note = request.data.get("note", "").strip()

        if action not in ("approved", "rejected"):
            return Response(
                {"detail": "Invalid action. Must be 'approved' or 'rejected'."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not note:
            return Response(
                {"detail": "A moderation note is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        now = timezone.now()

        if action == "approved":
            Report.objects.filter(pk=report.pk).update(
                visibility=True, updated_at=now, moderation_note=note
            )
            Notification.objects.create(
                recipient=report.citizen,
                report=report,
                type=Notification.Type.MODERATION,
                title="Report Approved",
                message=f"Your report has been approved and published to the community feed.\n\nModerator note: {note}",
            )
            User.objects.filter(pk=report.citizen_id).update(
                reputation_points=F("reputation_points") + 100
            )
        else:
            Report.objects.filter(pk=report.pk).update(
                status=Report.Status.REJECTED,
                visibility=False,
                updated_at=now,
                moderation_note=note,
            )
            Notification.objects.create(
                recipient=report.citizen,
                report=report,
                type=Notification.Type.MODERATION,
                title="Report Rejected",
                message=f"Your report has been rejected and will not be published.\n\nModerator note: {note}",
            )

        report.refresh_from_db()
        return Response(
            ReportSerializer(report, context={"request": request}).data
        )

    @action(detail=False, methods=["get"])
    def pending_moderation(self, request):
        qs = (
            Report.objects.filter(visibility=False, status=Report.Status.OPEN)
            .select_related("citizen")
            .order_by("-created_at")
        )
        page = self.paginate_queryset(qs)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(qs, many=True)
        return Response(serializer.data)


class FeedView(generics.ListAPIView):
    serializer_class = FeedReportSerializer
    permission_classes = [AllowAny]

    _sort_map = {
        "newest": "-created_at",
        "oldest": "created_at",
        "most_upvoted": "-total_upvotes",
        "most_commented": "-total_comments",
        "recently_updated": "-updated_at",
    }

    def get_queryset(self):
        user = self.request.user
        qs = (
            Report.objects.filter(visibility=True)
            .select_related("citizen")
            .prefetch_related("images", "videos")
            .annotate(
                total_upvotes=Count("upvotes", distinct=True),
                total_comments=Count("comments", distinct=True),
            )
        )

        if user.is_authenticated:
            qs = qs.annotate(
                has_upvoted=Exists(
                    Upvote.objects.filter(
                        report=OuterRef("pk"), user=user
                    )
                ),
            )
        else:
            qs = qs.annotate(
                has_upvoted=Value(False, output_field=BooleanField()),
            )

        q = self.request.query_params.get("q")
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(description__icontains=q)
                | Q(municipality__icontains=q)
                | Q(address__icontains=q)
            )

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        municipality = self.request.query_params.get("municipality")
        if municipality:
            qs = qs.filter(municipality__icontains=municipality)

        ward = self.request.query_params.get("ward")
        if ward:
            qs = qs.filter(ward_number=ward)

        visibility_param = self.request.query_params.get("visibility")
        if visibility_param is not None:
            qs = qs.filter(visibility=visibility_param.lower() == "true")

        date_from = self.request.query_params.get("date_from")
        if date_from:
            try:
                DateField().to_python(date_from)
                qs = qs.filter(created_at__date__gte=date_from)
            except (DjangoValidationError, ValueError, TypeError):
                pass

        date_to = self.request.query_params.get("date_to")
        if date_to:
            try:
                DateField().to_python(date_to)
                qs = qs.filter(created_at__date__lte=date_to)
            except (DjangoValidationError, ValueError, TypeError):
                pass

        sort = self.request.query_params.get("sort", "newest")
        order = self._sort_map.get(sort, "-created_at")
        qs = qs.order_by(order)

        return qs


class NearbyReportsView(APIView):
    def get(self, request):
        try:
            lat = float(request.query_params.get("lat", ""))
            lng = float(request.query_params.get("lng", ""))
            radius = float(request.query_params.get("radius", 1))
        except (ValueError, TypeError):
            return Response([])

        if radius <= 0:
            return Response([])

        lat_delta = radius / 111.0
        lng_delta = radius / (111.0 * abs(math.cos(math.radians(lat))) + 1e-9)

        candidates = list(
            Report.objects.filter(
                visibility=True,
                latitude__gte=lat - lat_delta,
                latitude__lte=lat + lat_delta,
                longitude__gte=lng - lng_delta,
                longitude__lte=lng + lng_delta,
            ).only(
                "id",
                "title",
                "category",
                "status",
                "latitude",
                "longitude",
            )
        )

        results = []
        for report in candidates:
            dist = _haversine(
                lat, lng, float(report.latitude), float(report.longitude)
            )
            if dist <= radius:
                results.append(
                    {
                        "id": report.id,
                        "title": report.title,
                        "category": report.category,
                        "status": report.status,
                        "latitude": float(report.latitude),
                        "longitude": float(report.longitude),
                        "distance_km": round(dist, 2),
                    }
                )

        results.sort(key=lambda r: r["distance_km"])
        return Response(results)


class UserReportsView(generics.ListAPIView):
    serializer_class = FeedReportSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        user_id = self.kwargs.get("pk")
        qs = (
            Report.objects.filter(citizen_id=user_id, visibility=True)
            .select_related("citizen")
            .prefetch_related("images", "videos")
            .annotate(
                total_upvotes=Count("upvotes", distinct=True),
                total_comments=Count("comments", distinct=True),
            )
        )
        if self.request.user.is_authenticated:
            qs = qs.annotate(
                has_upvoted=Exists(
                    Upvote.objects.filter(
                        report=OuterRef("pk"), user=self.request.user
                    )
                ),
            )
        else:
            qs = qs.annotate(has_upvoted=Value(False, output_field=BooleanField()))
        return qs.order_by("-created_at")


def _haversine(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c
