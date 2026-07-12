from django.db.models import Q
from django.utils import timezone

from rest_framework import generics

from notices.models import Notice
from notices.permissions import IsOfficialOrReadOnly
from notices.serializers import NoticeSerializer


class NoticeListCreateView(generics.ListCreateAPIView):
    serializer_class = NoticeSerializer
    permission_classes = [IsOfficialOrReadOnly]

    def get_queryset(self):
        now = timezone.now()
        qs = (
            Notice.objects.filter(
                is_published=True,
            )
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .select_related("created_by")
        )

        municipality = self.request.query_params.get("municipality")
        if municipality:
            qs = qs.filter(municipality__icontains=municipality)

        ward = self.request.query_params.get("ward")
        if ward:
            qs = qs.filter(ward_number=ward)

        pinned = self.request.query_params.get("pinned")
        if pinned is not None:
            qs = qs.filter(is_pinned=(pinned.lower() == "true"))

        search = self.request.query_params.get("search")
        if search:
            qs = qs.filter(
                Q(title__icontains=search) | Q(content__icontains=search)
            )

        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class NoticeDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Notice.objects.select_related("created_by").all()
    serializer_class = NoticeSerializer
    permission_classes = [IsOfficialOrReadOnly]

    def get_queryset(self):
        now = timezone.now()
        return (
            Notice.objects.select_related("created_by")
            .filter(is_published=True)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
        )
