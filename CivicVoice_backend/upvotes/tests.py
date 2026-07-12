from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from reports.models import Report
from upvotes.models import Upvote


class UpvoteAPITests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.other_citizen = User.objects.create_user(
            email="other@test.com",
            full_name="Other Citizen",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.official = User.objects.create_user(
            email="official@test.com",
            full_name="Official User",
            password="Pass1234!",
            role=User.Role.OFFICIAL,
        )
        self.report = Report.objects.create(
            citizen=self.citizen,
            title="Pothole on Main Road",
            description="Large pothole near the market",
            category="roads",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            visibility=True,
        )

    def test_citizen_can_upvote(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Upvote.objects.count(), 1)
        self.assertTrue(
            Upvote.objects.filter(
                report=self.report, user=self.citizen
            ).exists()
        )

    def test_official_can_upvote(self):
        self.client.force_authenticate(self.official)
        res = self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Upvote.objects.count(), 1)

    def test_anonymous_cannot_upvote(self):
        res = self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_duplicate_upvote_returns_400(self):
        self.client.force_authenticate(self.citizen)
        self.client.post(f"/api/reports/{self.report.id}/upvote/")
        res = self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Upvote.objects.count(), 1)

    def test_citizen_can_remove_upvote(self):
        self.client.force_authenticate(self.citizen)
        self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.assertEqual(Upvote.objects.count(), 1)

        res = self.client.delete(
            f"/api/reports/{self.report.id}/upvote/"
        )
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Upvote.objects.count(), 0)

    def test_remove_nonexistent_upvote_returns_404(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.delete(
            f"/api/reports/{self.report.id}/upvote/"
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_anonymous_cannot_remove_upvote(self):
        res = self.client.delete(
            f"/api/reports/{self.report.id}/upvote/"
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_upvotes_returns_count_and_users(self):
        self.client.force_authenticate(self.citizen)
        self.client.post(f"/api/reports/{self.report.id}/upvote/")
        self.client.force_authenticate(self.official)
        self.client.post(f"/api/reports/{self.report.id}/upvote/")

        self.client.force_authenticate(self.citizen)
        res = self.client.get(
            f"/api/reports/{self.report.id}/upvotes/"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 2)
        self.assertEqual(len(res.data["results"]), 2)

    def test_list_upvotes_anonymous_forbidden(self):
        res = self.client.get(
            f"/api/reports/{self.report.id}/upvotes/"
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class UpvoteSerializerFieldsTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.other = User.objects.create_user(
            email="other@test.com",
            full_name="Other User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.report = Report.objects.create(
            citizen=self.citizen,
            title="Test Report",
            description="Test",
            category="other",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            visibility=True,
        )

    def test_serializer_total_upvotes_reflects_count(self):
        Upvote.objects.create(report=self.report, user=self.citizen)
        Upvote.objects.create(report=self.report, user=self.other)

        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        for item in res.data["results"]:
            if item["id"] == self.report.id:
                self.assertEqual(item["total_upvotes"], 2)
                break
        else:
            self.fail("Report not found in feed")

    def test_serializer_has_upvoted_true_when_user_upvoted(self):
        Upvote.objects.create(report=self.report, user=self.citizen)

        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        for item in res.data["results"]:
            if item["id"] == self.report.id:
                self.assertTrue(item["has_upvoted"])
                break
        else:
            self.fail("Report not found in feed")

    def test_serializer_has_upvoted_false_when_other_user_upvoted(self):
        Upvote.objects.create(report=self.report, user=self.other)

        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        for item in res.data["results"]:
            if item["id"] == self.report.id:
                self.assertFalse(item["has_upvoted"])
                break
        else:
            self.fail("Report not found in feed")

    def test_serializer_fields_in_report_detail(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get(f"/api/reports/{self.report.id}/")
        self.assertIn("total_upvotes", res.data)
        self.assertIn("has_upvoted", res.data)
        self.assertEqual(res.data["total_upvotes"], 0)
        self.assertFalse(res.data["has_upvoted"])

    def test_serializer_fields_in_feed(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        item = res.data["results"][0]
        self.assertIn("total_upvotes", item)
        self.assertIn("has_upvoted", item)
