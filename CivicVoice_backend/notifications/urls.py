from django.urls import path

from notifications import views

urlpatterns = [
    path(
        "notifications/",
        views.NotificationListView.as_view(),
        name="notification-list",
    ),
    path(
        "notifications/read-all/",
        views.NotificationReadAllView.as_view(),
        name="notification-read-all",
    ),
    path(
        "notifications/<int:pk>/read/",
        views.NotificationReadView.as_view(),
        name="notification-read",
    ),
    path(
        "notifications/<int:pk>/",
        views.NotificationDeleteView.as_view(),
        name="notification-delete",
    ),
]
