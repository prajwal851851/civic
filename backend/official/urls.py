from django.urls import path

from . import views

urlpatterns = [
    path("dashboard/summary/", views.SummaryView.as_view(), name="dashboard-summary"),
    path(
        "dashboard/recent-reports/",
        views.RecentReportsView.as_view(),
        name="dashboard-recent-reports",
    ),
    path(
        "dashboard/analytics/",
        views.AnalyticsView.as_view(),
        name="dashboard-analytics",
    ),
]
