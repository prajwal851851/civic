from django.urls import path

from notices import views

urlpatterns = [
    path(
        "notices/",
        views.NoticeListCreateView.as_view(),
        name="notice-list",
    ),
    path(
        "notices/<int:pk>/",
        views.NoticeDetailView.as_view(),
        name="notice-detail",
    ),
]
