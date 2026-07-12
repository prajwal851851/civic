from django.urls import path

from comments import views

urlpatterns = [
    path(
        "reports/<int:report_id>/comments/",
        views.ReportCommentListCreateView.as_view(),
        name="report-comments",
    ),
    path(
        "comments/<int:pk>/",
        views.CommentDetailView.as_view(),
        name="comment-detail",
    ),
]
