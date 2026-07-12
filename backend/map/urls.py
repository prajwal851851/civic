from django.urls import path

from . import views

urlpatterns = [
    path("map/markers/", views.MapMarkersView.as_view(), name="map-markers"),
]
