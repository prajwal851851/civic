from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from comments.models import Comment
from comments.permissions import IsOfficialOrAuthor
from comments.serializers import CommentCreateSerializer, CommentSerializer
from reports.models import Report


class ReportCommentListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.request.method == "POST":
            return CommentCreateSerializer
        return CommentSerializer

    def get_queryset(self):
        report_id = self.kwargs.get("report_id")
        return (
            Comment.objects.filter(report_id=report_id, parent=None)
            .select_related("user")
            .prefetch_related("replies__user")
        )

    def perform_create(self, serializer):
        report_id = self.kwargs.get("report_id")
        report = get_object_or_404(Report, pk=report_id)
        serializer.save(user=self.request.user, report=report)

    def create(self, request, *args, **kwargs):
        report_id = self.kwargs.get("report_id")
        get_object_or_404(Report, pk=report_id)
        serializer = self.get_serializer(
            data=request.data,
            context={"report_id": report_id},
        )
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        read_serializer = CommentSerializer(
            serializer.instance, context={"request": request}
        )
        return Response(
            read_serializer.data, status=status.HTTP_201_CREATED
        )


class CommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Comment.objects.select_related("user").all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated, IsOfficialOrAuthor]

    def perform_update(self, serializer):
        serializer.save()

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", True)
        instance = self.get_object()
        serializer = self.get_serializer(
            instance, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        read_serializer = CommentSerializer(
            instance, context={"request": request}
        )
        return Response(read_serializer.data)
