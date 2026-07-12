from datetime import timedelta

from django.db.models import Count, Q
from django.utils import timezone
from rest_framework.generics import ListAPIView
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from notices.models import Notice
from reports.models import Report

from .permissions import IsOfficialUser
from .serializers import DashboardReportSerializer


class DashboardPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = "page_size"
    max_page_size = 100


class SummaryView(APIView):
    permission_classes = [IsAuthenticated, IsOfficialUser]

    def get(self, request):
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        start_of_month = today.replace(day=1)

        report_agg = Report.objects.aggregate(
            total_reports=Count("id"),
            open_reports=Count("id", filter=Q(status="open")),
            in_review_reports=Count("id", filter=Q(status="in_review")),
            resolved_reports=Count("id", filter=Q(status="resolved")),
            pending_ai_reports=Count("id", filter=Q(ai_status="pending")),
            reports_today=Count("id", filter=Q(created_at__date=today)),
            reports_this_week=Count(
                "id", filter=Q(created_at__date__gte=start_of_week)
            ),
            reports_this_month=Count(
                "id", filter=Q(created_at__date__gte=start_of_month)
            ),
        )

        report_agg["total_notices"] = Notice.objects.count()
        report_agg["total_citizens"] = (
            User.objects.filter(role="citizen").count()
        )

        return Response(report_agg)


class RecentReportsView(ListAPIView):
    permission_classes = [IsAuthenticated, IsOfficialUser]
    serializer_class = DashboardReportSerializer
    pagination_class = DashboardPagination

    def get_queryset(self):
        qs = Report.objects.select_related("citizen").only(
            "id",
            "title",
            "category",
            "status",
            "municipality",
            "ward_number",
            "visibility",
            "citizen__full_name",
            "created_at",
        )

        municipality = self.request.query_params.get("municipality")
        ward = self.request.query_params.get("ward")
        status = self.request.query_params.get("status")
        category = self.request.query_params.get("category")

        if municipality:
            qs = qs.filter(municipality__iexact=municipality)
        if ward:
            qs = qs.filter(ward_number=ward)
        if status:
            qs = qs.filter(status=status)
        if category:
            qs = qs.filter(category=category)

        return qs.order_by("-created_at")


class AnalyticsView(APIView):
    permission_classes = [IsAuthenticated, IsOfficialUser]

    def get(self, request):
        base_qs = Report.objects.all()
        municipality = request.query_params.get("municipality")
        ward = request.query_params.get("ward")
        status_param = request.query_params.get("status")
        category_param = request.query_params.get("category")

        if municipality:
            base_qs = base_qs.filter(municipality__iexact=municipality)
        if ward:
            base_qs = base_qs.filter(ward_number=ward)

        by_category = (
            base_qs.values("category")
            .annotate(count=Count("id"))
            .order_by("category")
        )

        by_status = (
            base_qs.values("status")
            .annotate(count=Count("id"))
            .order_by("status")
        )

        by_municipality = (
            base_qs.values("municipality")
            .annotate(count=Count("id"))
            .order_by("municipality")
        )

        by_ward = (
            base_qs.values("ward_number")
            .annotate(count=Count("id"))
            .order_by("ward_number")
        )

        return Response(
            {
                "by_category": by_category,
                "by_status": by_status,
                "by_municipality": by_municipality,
                "by_ward": by_ward,
            }
        )
