from datetime import timedelta

from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import User
from notices.models import Notice
from reports.models import Report


class DashboardPermissionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.official = User.objects.create_user(
            email="official@test.com",
            password="password",
            full_name="Official User",
            role="official",
        )
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            password="password",
            full_name="Citizen User",
            role="citizen",
        )

    def test_official_access_summary(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_citizen_blocked_summary(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_blocked_summary(self):
        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_official_access_recent_reports(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get(reverse("dashboard-recent-reports"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_citizen_blocked_recent_reports(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get(reverse("dashboard-recent-reports"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_access_analytics(self):
        self.client.force_authenticate(user=self.official)
        response = self.client.get(reverse("dashboard-analytics"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_citizen_blocked_analytics(self):
        self.client.force_authenticate(user=self.citizen)
        response = self.client.get(reverse("dashboard-analytics"))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class DashboardSummaryTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.official = User.objects.create_user(
            email="official@test.com",
            password="password",
            full_name="Official User",
            role="official",
        )
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            password="password",
            full_name="Citizen",
            role="citizen",
        )
        self.client.force_authenticate(user=self.official)

    def test_summary_returns_zero_by_default(self):
        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["total_reports"], 0)
        self.assertEqual(response.data["open_reports"], 0)
        self.assertEqual(response.data["in_review_reports"], 0)
        self.assertEqual(response.data["resolved_reports"], 0)
        self.assertEqual(response.data["pending_ai_reports"], 0)
        self.assertEqual(response.data["total_notices"], 0)
        self.assertEqual(response.data["total_citizens"], 1)
        self.assertEqual(response.data["reports_today"], 0)

    def test_summary_counts_reports(self):
        for i in range(3):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="desc",
                category="roads",
                latitude=27.0,
                longitude=85.0,
                municipality="Kathmandu",
                ward_number=1,
                status="open",
            )
        Report.objects.create(
            citizen=self.citizen,
            title="In Review Report",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=2,
            status="in_review",
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Resolved Report",
            description="desc",
            category="electricity",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
            status="resolved",
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["total_reports"], 5)
        self.assertEqual(response.data["open_reports"], 3)
        self.assertEqual(response.data["in_review_reports"], 1)
        self.assertEqual(response.data["resolved_reports"], 1)

    def test_summary_counts_pending_ai(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Pending AI",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
            ai_status="pending",
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Approved AI",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
            ai_status="approved",
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["pending_ai_reports"], 1)

    def test_summary_counts_notices(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice 1",
            content="Content",
            municipality="Kathmandu",
        )
        Notice.objects.create(
            created_by=self.official,
            title="Notice 2",
            content="Content",
            municipality="Lalitpur",
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["total_notices"], 2)

    def test_summary_counts_citizens(self):
        User.objects.create_user(
            email="citizen2@test.com",
            password="password",
            full_name="Citizen 2",
            role="citizen",
        )
        User.objects.create_user(
            email="citizen3@test.com",
            password="password",
            full_name="Citizen 3",
            role="citizen",
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["total_citizens"], 3)

    def test_summary_reports_today(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Today Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["reports_today"], 1)

    def test_summary_reports_this_week(self):
        Report.objects.create(
            citizen=self.citizen,
            title="This Week Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["reports_this_week"], 1)

    def test_summary_reports_this_month(self):
        Report.objects.create(
            citizen=self.citizen,
            title="This Month Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )

        response = self.client.get(reverse("dashboard-summary"))
        self.assertEqual(response.data["reports_this_month"], 1)


class DashboardRecentReportsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.official = User.objects.create_user(
            email="official@test.com",
            password="password",
            full_name="Official User",
            role="official",
        )
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            password="password",
            full_name="Test Citizen",
            role="citizen",
        )
        self.client.force_authenticate(user=self.official)

    def test_returns_empty_list(self):
        response = self.client.get(reverse("dashboard-recent-reports"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])

    def test_returns_reports_newest_first(self):
        for i in range(3):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="desc",
                category="roads",
                latitude=27.0,
                longitude=85.0,
                municipality="Kathmandu",
                ward_number=1,
            )

        response = self.client.get(reverse("dashboard-recent-reports"))
        results = response.data["results"]
        self.assertEqual(len(results), 3)
        self.assertEqual(results[0]["title"], "Report 2")

    def test_returns_citizen_name(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Citizen Report",
            description="desc",
            category="garbage",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )

        response = self.client.get(reverse("dashboard-recent-reports"))
        self.assertEqual(
            response.data["results"][0]["citizen_name"], "Test Citizen"
        )

    def test_returns_required_fields(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Full Report",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=3,
        )

        result = self.client.get(reverse("dashboard-recent-reports")).data[
            "results"
        ][0]
        expected_fields = {
            "id",
            "title",
            "category",
            "status",
            "municipality",
            "ward_number",
            "citizen_name",
            "created_at",
        }
        self.assertEqual(set(result.keys()), expected_fields)

    def test_filter_by_municipality(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Kathmandu Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Lalitpur Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
        )

        response = self.client.get(
            reverse("dashboard-recent-reports"),
            {"municipality": "Kathmandu"},
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["title"], "Kathmandu Report"
        )

    def test_filter_by_ward(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Ward 1",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Ward 2",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=2,
        )

        response = self.client.get(
            reverse("dashboard-recent-reports"), {"ward": 2}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Ward 2")

    def test_filter_by_status(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Open Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
            status="open",
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Resolved Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
            status="resolved",
        )

        response = self.client.get(
            reverse("dashboard-recent-reports"), {"status": "resolved"}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(
            response.data["results"][0]["title"], "Resolved Report"
        )

    def test_filter_by_category(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Roads Report",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Water Report",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )

        response = self.client.get(
            reverse("dashboard-recent-reports"), {"category": "water"}
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Water Report")

    def test_filter_combination(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Match",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=3,
            status="open",
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Wrong Ward",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=5,
            status="open",
        )

        response = self.client.get(
            reverse("dashboard-recent-reports"),
            {"municipality": "Kathmandu", "ward": 3, "status": "open", "category": "roads"},
        )
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["title"], "Match")

    def test_pagination_default_page_size(self):
        for i in range(25):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="desc",
                category="roads",
                latitude=27.0,
                longitude=85.0,
                municipality="Kathmandu",
                ward_number=1,
            )

        response = self.client.get(reverse("dashboard-recent-reports"))
        self.assertEqual(len(response.data["results"]), 20)
        self.assertIsNotNone(response.data["next"])

    def test_pagination_custom_page_size(self):
        for i in range(10):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="desc",
                category="roads",
                latitude=27.0,
                longitude=85.0,
                municipality="Kathmandu",
                ward_number=1,
            )

        response = self.client.get(
            reverse("dashboard-recent-reports"), {"page_size": 5}
        )
        self.assertEqual(len(response.data["results"]), 5)

    def test_pagination_max_page_size(self):
        for i in range(150):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="desc",
                category="roads",
                latitude=27.0,
                longitude=85.0,
                municipality="Kathmandu",
                ward_number=1,
            )

        response = self.client.get(
            reverse("dashboard-recent-reports"), {"page_size": 200}
        )
        self.assertEqual(len(response.data["results"]), 100)


class DashboardAnalyticsTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.official = User.objects.create_user(
            email="official@test.com",
            password="password",
            full_name="Official User",
            role="official",
        )
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            password="password",
            full_name="Citizen",
            role="citizen",
        )
        self.client.force_authenticate(user=self.official)

    def test_analytics_returns_empty_breakdowns(self):
        response = self.client.get(reverse("dashboard-analytics"))
        self.assertEqual(len(response.data["by_category"]), 0)
        self.assertEqual(len(response.data["by_status"]), 0)
        self.assertEqual(len(response.data["by_municipality"]), 0)
        self.assertEqual(len(response.data["by_ward"]), 0)

    def test_analytics_by_category(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Roads",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Roads 2",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Water",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=2,
        )

        response = self.client.get(reverse("dashboard-analytics"))
        by_category = {
            item["category"]: item["count"] for item in response.data["by_category"]
        }
        self.assertEqual(by_category["roads"], 2)
        self.assertEqual(by_category["water"], 1)

    def test_analytics_by_status(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Open",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
            status="open",
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Resolved",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
            status="resolved",
        )

        response = self.client.get(reverse("dashboard-analytics"))
        by_status = {
            item["status"]: item["count"] for item in response.data["by_status"]
        }
        self.assertEqual(by_status["open"], 1)
        self.assertEqual(by_status["resolved"], 1)

    def test_analytics_by_municipality(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Ktm",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Ltp",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
        )

        response = self.client.get(reverse("dashboard-analytics"))
        by_municipality = {
            item["municipality"]: item["count"]
            for item in response.data["by_municipality"]
        }
        self.assertEqual(by_municipality["Kathmandu"], 1)
        self.assertEqual(by_municipality["Lalitpur"], 1)

    def test_analytics_by_ward(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Ward 1",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Ward 2",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=2,
        )

        response = self.client.get(reverse("dashboard-analytics"))
        by_ward = {
            item["ward_number"]: item["count"]
            for item in response.data["by_ward"]
        }
        self.assertEqual(by_ward[1], 1)
        self.assertEqual(by_ward[2], 1)

    def test_analytics_filters(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Roads Ktm",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Roads Ltp",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Lalitpur",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Water Ktm",
            description="desc",
            category="water",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )

        response = self.client.get(
            reverse("dashboard-analytics"), {"municipality": "Kathmandu"}
        )
        by_category = {
            item["category"]: item["count"] for item in response.data["by_category"]
        }
        by_municipality = {
            item["municipality"]: item["count"]
            for item in response.data["by_municipality"]
        }
        self.assertEqual(by_category["roads"], 1)
        self.assertEqual(by_category["water"], 1)
        self.assertEqual(by_municipality["Kathmandu"], 2)

    def test_analytics_by_ward_filters_with_ward(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Ward 1 Ktm",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=1,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Ward 2 Ktm",
            description="desc",
            category="roads",
            latitude=27.0,
            longitude=85.0,
            municipality="Kathmandu",
            ward_number=2,
        )

        response = self.client.get(
            reverse("dashboard-analytics"), {"ward": 1}
        )
        by_ward = {
            item["ward_number"]: item["count"]
            for item in response.data["by_ward"]
        }
        self.assertEqual(by_ward[1], 1)
        self.assertNotIn(2, by_ward)
