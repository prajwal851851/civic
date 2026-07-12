from rest_framework.generics import ListAPIView

from reports.models import Report

from .serializers import MapMarkerSerializer


class MapMarkersView(ListAPIView):
    serializer_class = MapMarkerSerializer

    def get_queryset(self):
        qs = (
            Report.objects.filter(visibility=True)
            .only(
                "id",
                "title",
                "category",
                "status",
                "latitude",
                "longitude",
                "municipality",
                "ward_number",
            )
            .order_by("-created_at")
        )

        municipality = self.request.query_params.get("municipality")
        if municipality:
            qs = qs.filter(municipality__iexact=municipality)

        ward = self.request.query_params.get("ward")
        if ward:
            qs = qs.filter(ward_number=ward)

        category = self.request.query_params.get("category")
        if category:
            qs = qs.filter(category=category)

        status_param = self.request.query_params.get("status")
        if status_param:
            qs = qs.filter(status=status_param)

        bbox = self.request.query_params.get("bbox")
        if bbox:
            parts = bbox.split(",")
            if len(parts) == 4:
                try:
                    min_lng, min_lat, max_lng, max_lat = map(float, parts)
                    qs = qs.filter(
                        latitude__gte=min_lat,
                        latitude__lte=max_lat,
                        longitude__gte=min_lng,
                        longitude__lte=max_lng,
                    )
                except (ValueError, TypeError):
                    pass

        return qs
