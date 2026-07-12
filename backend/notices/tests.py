from django.utils import timezone

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from notices.models import Notice
from notifications.models import Notification


class NoticeAPITests(APITestCase):
    def setUp(self):
        self.official = User.objects.create_user(
            email="official@test.com",
            full_name="Official User",
            password="Pass1234!",
            role=User.Role.OFFICIAL,
            municipality="Kathmandu",
            ward_number=5,
        )
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
            municipality="Kathmandu",
            ward_number=5,
        )
        self.citizen2 = User.objects.create_user(
            email="citizen2@test.com",
            full_name="Citizen Two",
            password="Pass1234!",
            role=User.Role.CITIZEN,
            municipality="Lalitpur",
            ward_number=3,
        )
        self.notice_data = {
            "title": "Road Repair Notice",
            "content": "Roads will be repaired next week.",
            "municipality": "Kathmandu",
            "ward_number": 5,
        }

    # --- POST /api/notices/ ---

    def test_official_create_notice(self):
        self.client.force_authenticate(self.official)
        res = self.client.post("/api/notices/", self.notice_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["title"], self.notice_data["title"])
        self.assertEqual(res.data["created_by_name"], self.official.full_name)
        self.assertEqual(res.data["municipality"], self.notice_data["municipality"])

    def test_citizen_cannot_create_notice(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post("/api/notices/", self.notice_data)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_create_notice(self):
        res = self.client.post("/api/notices/", self.notice_data)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_notice_returns_expected_fields(self):
        self.client.force_authenticate(self.official)
        res = self.client.post("/api/notices/", self.notice_data)
        expected = {
            "id", "title", "content", "municipality", "ward_number",
            "is_pinned", "expires_at", "created_at", "updated_at",
            "created_by_name",
        }
        self.assertEqual(set(res.data.keys()), expected)

    def test_create_notice_defaults_to_not_pinned(self):
        self.client.force_authenticate(self.official)
        res = self.client.post("/api/notices/", self.notice_data)
        self.assertFalse(res.data["is_pinned"])

    # --- GET /api/notices/ ---

    def test_list_notices(self):
        self.client.force_authenticate(self.official)
        self.client.post("/api/notices/", self.notice_data)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_anonymous_cannot_list(self):
        res = self.client.get("/api/notices/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_citizen_can_list(self):
        Notice.objects.create(created_by=self.official, **self.notice_data)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_pinned_notices_first_in_order(self):
        Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        Notice.objects.create(
            created_by=self.official,
            title="Pinned Notice",
            content="Important",
            municipality="Kathmandu",
            ward_number=5,
            is_pinned=True,
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(res.data["results"][0]["title"], "Pinned Notice")

    def test_newest_first_within_same_pin_status(self):
        Notice.objects.create(created_by=self.official, **self.notice_data)
        n = Notice.objects.create(
            created_by=self.official,
            title="Older Notice",
            content="Older",
            municipality="Kathmandu",
            ward_number=5,
        )
        from django.db.models.functions import Now
        Notice.objects.filter(pk=n.pk).update(created_at=timezone.now() - timezone.timedelta(days=1))
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(res.data["results"][0]["title"], self.notice_data["title"])

    def test_expired_notice_excluded(self):
        Notice.objects.create(
            created_by=self.official,
            expires_at=timezone.now() - timezone.timedelta(days=1),
            **self.notice_data,
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(len(res.data["results"]), 0)

    def test_unexpired_notice_included(self):
        Notice.objects.create(
            created_by=self.official,
            expires_at=timezone.now() + timezone.timedelta(days=1),
            **self.notice_data,
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(len(res.data["results"]), 1)

    def test_notice_without_expiry_included(self):
        Notice.objects.create(created_by=self.official, **self.notice_data)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(len(res.data["results"]), 1)

    def test_unpublished_notice_excluded(self):
        Notice.objects.create(
            created_by=self.official, is_published=False, **self.notice_data
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/")
        self.assertEqual(len(res.data["results"]), 0)

    # --- GET /api/notices/{id}/ ---

    def test_retrieve_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get(f"/api/notices/{notice.id}/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], self.notice_data["title"])

    def test_retrieve_expired_notice_returns_404(self):
        notice = Notice.objects.create(
            created_by=self.official,
            expires_at=timezone.now() - timezone.timedelta(days=1),
            **self.notice_data,
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get(f"/api/notices/{notice.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_retrieve_unpublished_notice_returns_404(self):
        notice = Notice.objects.create(
            created_by=self.official, is_published=False, **self.notice_data
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get(f"/api/notices/{notice.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- PATCH /api/notices/{id}/ ---

    def test_official_update_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        self.client.force_authenticate(self.official)
        res = self.client.patch(
            f"/api/notices/{notice.id}/",
            {"title": "Updated Title"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Updated Title")

    def test_citizen_cannot_update_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.patch(
            f"/api/notices/{notice.id}/",
            {"title": "Hacked"},
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_update_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        res = self.client.patch(
            f"/api/notices/{notice.id}/",
            {"title": "Hacked"},
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- DELETE /api/notices/{id}/ ---

    def test_official_delete_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        self.client.force_authenticate(self.official)
        res = self.client.delete(f"/api/notices/{notice.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Notice.objects.filter(id=notice.id).exists())

    def test_citizen_cannot_delete_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.delete(f"/api/notices/{notice.id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_anonymous_cannot_delete_notice(self):
        notice = Notice.objects.create(
            created_by=self.official, **self.notice_data
        )
        res = self.client.delete(f"/api/notices/{notice.id}/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class NoticeFilterTests(APITestCase):
    def setUp(self):
        self.official = User.objects.create_user(
            email="official@test.com",
            full_name="Official",
            password="Pass1234!",
            role=User.Role.OFFICIAL,
        )
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.notice1 = Notice.objects.create(
            created_by=self.official,
            title="Road Repair",
            content="Fixing potholes on Main Road",
            municipality="Kathmandu",
            ward_number=5,
            is_pinned=True,
        )
        self.notice2 = Notice.objects.create(
            created_by=self.official,
            title="Water Supply",
            content="Water schedule for this week",
            municipality="Lalitpur",
            ward_number=3,
        )
        self.notice3 = Notice.objects.create(
            created_by=self.official,
            title="Garbage Collection",
            content="New garbage pickup times",
            municipality="Kathmandu",
            ward_number=5,
        )

    def test_filter_by_municipality(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?municipality=Kathmandu")
        self.assertEqual(len(res.data["results"]), 2)

    def test_filter_by_municipality_case_insensitive(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?municipality=kathmandu")
        self.assertEqual(len(res.data["results"]), 2)

    def test_filter_by_ward(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?ward=3")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["title"], "Water Supply")

    def test_filter_by_pinned(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?pinned=true")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["title"], "Road Repair")

    def test_filter_by_pinned_false(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?pinned=false")
        self.assertEqual(len(res.data["results"]), 2)

    def test_search_title(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?search=road")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["title"], "Road Repair")

    def test_search_title_case_insensitive(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?search=ROAD")
        self.assertEqual(len(res.data["results"]), 1)

    def test_search_content(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?search=potholes")
        self.assertEqual(len(res.data["results"]), 1)

    def test_search_no_results(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notices/?search=nonexistent")
        self.assertEqual(len(res.data["results"]), 0)


class NoticeNotificationTests(APITestCase):
    def setUp(self):
        self.official = User.objects.create_user(
            email="official@test.com",
            full_name="Official User",
            password="Pass1234!",
            role=User.Role.OFFICIAL,
        )
        self.citizen_kathmandu_5 = User.objects.create_user(
            email="citizen1@test.com",
            full_name="Citizen One",
            password="Pass1234!",
            role=User.Role.CITIZEN,
            municipality="Kathmandu",
            ward_number=5,
        )
        self.citizen_kathmandu_3 = User.objects.create_user(
            email="citizen2@test.com",
            full_name="Citizen Two",
            password="Pass1234!",
            role=User.Role.CITIZEN,
            municipality="Kathmandu",
            ward_number=3,
        )
        self.citizen_lalitpur = User.objects.create_user(
            email="citizen3@test.com",
            full_name="Citizen Three",
            password="Pass1234!",
            role=User.Role.CITIZEN,
            municipality="Lalitpur",
            ward_number=5,
        )

    def test_notice_creates_notifications_for_matching_ward(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice",
            content="Content",
            municipality="Kathmandu",
            ward_number=5,
        )
        notifications = Notification.objects.filter(
            type=Notification.Type.NOTICE
        )
        self.assertEqual(notifications.count(), 1)
        self.assertEqual(
            notifications.first().recipient, self.citizen_kathmandu_5
        )

    def test_notice_notifies_entire_municipality_when_no_ward(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice",
            content="Content",
            municipality="Kathmandu",
            ward_number=None,
        )
        notifications = Notification.objects.filter(
            type=Notification.Type.NOTICE
        )
        self.assertEqual(notifications.count(), 2)

    def test_notice_does_not_notify_wrong_municipality(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice",
            content="Content",
            municipality="Lalitpur",
            ward_number=5,
        )
        notifications = Notification.objects.filter(
            type=Notification.Type.NOTICE
        )
        self.assertEqual(notifications.count(), 1)
        self.assertEqual(
            notifications.first().recipient, self.citizen_lalitpur
        )

    def test_notice_notification_title_and_message(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice",
            content="Content",
            municipality="Kathmandu",
            ward_number=5,
        )
        n = Notification.objects.filter(type=Notification.Type.NOTICE).first()
        self.assertEqual(n.title, "New Notice")
        self.assertEqual(n.message, "A new municipal notice has been published.")

    def test_official_does_not_receive_notification(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice",
            content="Content",
            municipality="Kathmandu",
            ward_number=5,
        )
        notifications = Notification.objects.filter(
            recipient=self.official
        )
        self.assertEqual(notifications.count(), 0)

    def test_no_notification_if_unpublished(self):
        Notice.objects.create(
            created_by=self.official,
            title="Notice",
            content="Content",
            municipality="Kathmandu",
            ward_number=5,
            is_published=False,
        )
        self.assertEqual(Notification.objects.count(), 0)
