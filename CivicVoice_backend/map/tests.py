from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from reports.models import Report


class MapAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            password="password",
            full_name="Citizen",
            role="citizen",
        )

    def test_anonymous_blocked_markers(self):
        response = self.client.get(reverse("map-markers"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_anonymous_blocked_nearby(self):
        response = self.client.get(reverse("report-nearby"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_citizen_can_access_markers(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get(reverse("map-markers"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class MapMarkerTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="user@test.com",
            password="password",
            full_name="User",
            role="citizen",
        )
        self.client.force_authenticate(user=self.user)

        self.report = Report.objects.create(
            citizen=self.user,
            title="Broken Street Light",
            description="A broken street light on the main road.",
            category="street_lights",
            status="open",
            latitude=27.671,
            longitude=85.429,
            municipality="Lalitpur",
            ward_number=5,
        )

    def test_returns_expected_fields(self):
        response = self.client.get(reverse("map-markers"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data["results"]
        self.assertEqual(len(results), 1)
        marker = results[0]
        expected = {"id", "title", "category", "status", "latitude", "longitude", "municipality", "ward_number"}
        self.assertEqual(set(marker.keys()), expected)

    def test_does_not_return_description(self):
        response = self.client.get(reverse("map-markers"))
        marker = response.data["results"][0]
        self.assertNotIn("description", marker)

    def test_filter_by_municipality(self):
        Report.objects.create(
            citizen=self.user,
            title="Water Issue",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        response = self.client.get(
            reverse("map-markers"), {"municipality": "Lalitpur"}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["title"], "Broken Street Light"
        )

    def test_filter_by_ward(self):
        Report.objects.create(
            citizen=self.user,
            title="Ward 3 Issue",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=3,
        )
        response = self.client.get(
            reverse("map-markers"), {"ward": 5}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["title"], "Broken Street Light"
        )

    def test_filter_by_category(self):
        Report.objects.create(
            citizen=self.user,
            title="Garbage Issue",
            description="desc",
            category="garbage",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
        )
        response = self.client.get(
            reverse("map-markers"), {"category": "garbage"}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Garbage Issue")

    def test_filter_by_status(self):
        Report.objects.create(
            citizen=self.user,
            title="Resolved Issue",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
            status="resolved",
        )
        response = self.client.get(
            reverse("map-markers"), {"status": "resolved"}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Resolved Issue")

    def test_bbox_filter(self):
        Report.objects.create(
            citizen=self.user,
            title="Inside Box",
            description="desc",
            category="roads",
            latitude=27.65,
            longitude=85.35,
            municipality="Lalitpur",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.user,
            title="Outside Box",
            description="desc",
            category="roads",
            latitude=28.00,
            longitude=86.00,
            municipality="Outside",
            ward_number=1,
        )
        bbox = "85.30,27.60,85.40,27.70"
        response = self.client.get(
            reverse("map-markers"), {"bbox": bbox}
        )
        titles = [r["title"] for r in response.data["results"]]
        self.assertIn("Inside Box", titles)
        self.assertNotIn("Outside Box", titles)

    def test_bbox_invalid_ignored(self):
        response = self.client.get(
            reverse("map-markers"), {"bbox": "not-a-bbox"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_only_visible_reports_returned(self):
        Report.objects.create(
            citizen=self.user,
            title="Hidden Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
            visibility=False,
        )
        response = self.client.get(reverse("map-markers"))
        self.assertEqual(len(response.data["results"]), 1)

    def test_empty_results(self):
        Report.objects.all().delete()
        response = self.client.get(reverse("map-markers"))
        self.assertEqual(len(response.data["results"]), 0)


class NearbyReportTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email="user@test.com",
            password="password",
            full_name="User",
            role="citizen",
        )
        self.client.force_authenticate(user=self.user)

        self.center_lat = 27.671
        self.center_lng = 85.429

        self.nearby = Report.objects.create(
            citizen=self.user,
            title="Nearby Report",
            description="desc",
            category="roads",
            latitude=27.672,
            longitude=85.430,
            municipality="Lalitpur",
            ward_number=5,
        )

        self.far = Report.objects.create(
            citizen=self.user,
            title="Far Report",
            description="desc",
            category="roads",
            latitude=28.000,
            longitude=86.000,
            municipality="Far",
            ward_number=1,
        )

    def test_nearby_returns_reports_within_radius(self):
        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": 1},
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [r["title"] for r in response.data]
        self.assertIn("Nearby Report", titles)
        self.assertNotIn("Far Report", titles)

    def test_nearby_distance_ordering(self):
        Report.objects.create(
            citizen=self.user,
            title="Closest",
            description="desc",
            category="roads",
            latitude=self.center_lat + 0.0001,
            longitude=self.center_lng + 0.0001,
            municipality="Lalitpur",
            ward_number=5,
        )

        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": 5},
        )
        distances = [r["distance_km"] for r in response.data]
        self.assertEqual(distances, sorted(distances))

    def test_nearby_distance_km_rounded(self):
        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": 1},
        )
        for r in response.data:
            self.assertEqual(len(str(r["distance_km"]).split(".")[1]), 2)

    def test_nearby_returns_required_fields(self):
        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": 1},
        )
        result = response.data[0]
        expected = {
            "id", "title", "category", "status",
            "latitude", "longitude", "distance_km",
        }
        self.assertEqual(set(result.keys()), expected)

    def test_nearby_empty_without_params(self):
        response = self.client.get(reverse("report-nearby"))
        self.assertEqual(response.data, [])

    def test_nearby_invalid_lat_returns_empty(self):
        response = self.client.get(
            reverse("report-nearby"), {"lat": "invalid", "lng": 85.0, "radius": 1}
        )
        self.assertEqual(response.data, [])

    def test_nearby_zero_radius_returns_empty(self):
        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": 0},
        )
        self.assertEqual(response.data, [])

    def test_nearby_negative_radius_returns_empty(self):
        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": -1},
        )
        self.assertEqual(response.data, [])

    def test_nearby_only_visible_reports(self):
        Report.objects.create(
            citizen=self.user,
            title="Hidden Nearby",
            description="desc",
            category="roads",
            latitude=self.center_lat + 0.001,
            longitude=self.center_lng + 0.001,
            municipality="Lalitpur",
            ward_number=5,
            visibility=False,
        )
        response = self.client.get(
            reverse("report-nearby"),
            {"lat": self.center_lat, "lng": self.center_lng, "radius": 5},
        )
        titles = [r["title"] for r in response.data]
        self.assertNotIn("Hidden Nearby", titles)
