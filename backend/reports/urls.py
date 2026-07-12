from django.urls import include, path
from rest_framework.routers import DefaultRouter

from reports import views

router = DefaultRouter()
router.register("reports", views.ReportViewSet, basename="report")

urlpatterns = [
    path("feed/", views.FeedView.as_view(), name="feed"),
    path("reports/nearby/", views.NearbyReportsView.as_view(), name="report-nearby"),
    path("reports/user/<int:pk>/", views.UserReportsView.as_view(), name="user-reports"),
    path("", include(router.urls)),
]
