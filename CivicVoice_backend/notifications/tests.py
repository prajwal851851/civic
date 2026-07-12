from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from comments.models import Comment
from notifications.models import Notification
from reports.models import Report
from upvotes.models import Upvote


class NotificationAPITests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.citizen2 = User.objects.create_user(
            email="citizen2@test.com",
            full_name="Citizen Two",
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
            title="Pothole",
            description="Big pothole",
            category="roads",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            visibility=True,
        )

    def _create_notification(
        self, recipient, actor=None, is_read=False, type=Notification.Type.COMMENT
    ):
        return Notification.objects.create(
            recipient=recipient,
            actor=actor,
            report=self.report,
            type=type,
            title="Test notification",
            message="Test message",
            is_read=is_read,
        )

    # --- GET /api/notifications/ ---

    def test_list_own_notifications(self):
        self._create_notification(recipient=self.citizen, actor=self.citizen2)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_cannot_list_others_notifications(self):
        self._create_notification(recipient=self.citizen, actor=self.citizen2)
        self.client.force_authenticate(self.citizen2)
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 0)

    def test_unauthenticated_cannot_list(self):
        res = self.client.get("/api/notifications/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_ordered_newest_first(self):
        self._create_notification(
            recipient=self.citizen, type=Notification.Type.COMMENT
        )
        self._create_notification(
            recipient=self.citizen, type=Notification.Type.UPVOTE
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        self.assertEqual(len(res.data["results"]), 2)
        self.assertEqual(res.data["results"][0]["type"], "UPVOTE")
        self.assertEqual(res.data["results"][1]["type"], "COMMENT")

    def test_list_pagination_20_per_page(self):
        for _ in range(25):
            self._create_notification(recipient=self.citizen)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        self.assertEqual(len(res.data["results"]), 20)
        self.assertIsNotNone(res.data["next"])

    def test_list_includes_actor_name(self):
        self._create_notification(recipient=self.citizen, actor=self.citizen2)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        item = res.data["results"][0]
        self.assertIn("actor_name", item)
        self.assertEqual(item["actor_name"], self.citizen2.full_name)

    def test_actor_name_null_when_no_actor(self):
        self._create_notification(recipient=self.citizen, actor=None)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        item = res.data["results"][0]
        self.assertIsNone(item["actor_name"])

    def test_list_includes_report_id(self):
        self._create_notification(recipient=self.citizen, actor=self.citizen2)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        item = res.data["results"][0]
        self.assertIn("report_id", item)
        self.assertEqual(item["report_id"], self.report.id)

    def test_report_id_null_when_no_report(self):
        Notification.objects.create(
            recipient=self.citizen,
            actor=self.citizen2,
            type=Notification.Type.COMMENT,
            title="No report",
            message="No report notification",
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        item = res.data["results"][0]
        self.assertIsNone(item["report_id"])

    def test_list_shows_only_own_notifications(self):
        self._create_notification(recipient=self.citizen, actor=self.citizen2)
        self._create_notification(recipient=self.citizen2, actor=self.citizen)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        self.assertEqual(len(res.data["results"]), 1)

    def test_serializer_returns_expected_fields(self):
        self._create_notification(recipient=self.citizen, actor=self.citizen2)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/notifications/")
        item = res.data["results"][0]
        expected = {"id", "type", "title", "message", "is_read", "created_at", "actor_name", "report_id"}
        self.assertEqual(set(item.keys()), expected)

    # --- PATCH /api/notifications/{id}/read/ ---

    def test_mark_single_as_read(self):
        notification = self._create_notification(
            recipient=self.citizen, is_read=False
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.patch(f"/api/notifications/{notification.id}/read/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["is_read"])

    def test_mark_single_as_read_updates_database(self):
        notification = self._create_notification(
            recipient=self.citizen, is_read=False
        )
        self.client.force_authenticate(self.citizen)
        self.client.patch(f"/api/notifications/{notification.id}/read/")
        notification.refresh_from_db()
        self.assertTrue(notification.is_read)

    def test_cannot_mark_others_notification_as_read(self):
        notification = self._create_notification(
            recipient=self.citizen, is_read=False
        )
        self.client.force_authenticate(self.citizen2)
        res = self.client.patch(f"/api/notifications/{notification.id}/read/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_mark_read_unauthenticated(self):
        notification = self._create_notification(recipient=self.citizen)
        res = self.client.patch(f"/api/notifications/{notification.id}/read/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_mark_read_nonexistent_notification(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.patch("/api/notifications/999/read/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    # --- PATCH /api/notifications/read-all/ ---

    def test_mark_all_as_read(self):
        self._create_notification(recipient=self.citizen, is_read=False)
        self._create_notification(recipient=self.citizen, is_read=False)
        self.client.force_authenticate(self.citizen)
        res = self.client.patch("/api/notifications/read-all/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Notification.objects.filter(
            recipient=self.citizen, is_read=True
        ).count(), 2)

    def test_mark_all_as_read_no_unread(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.patch("/api/notifications/read-all/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_mark_all_read_only_affects_own(self):
        self._create_notification(recipient=self.citizen, is_read=False)
        self._create_notification(recipient=self.citizen2, is_read=False)
        self.client.force_authenticate(self.citizen)
        self.client.patch("/api/notifications/read-all/")
        self.assertTrue(
            Notification.objects.get(recipient=self.citizen).is_read
        )
        self.assertFalse(
            Notification.objects.get(recipient=self.citizen2).is_read
        )

    def test_mark_all_read_unauthenticated(self):
        res = self.client.patch("/api/notifications/read-all/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    # --- DELETE /api/notifications/{id}/ ---

    def test_delete_own_notification(self):
        notification = self._create_notification(recipient=self.citizen)
        self.client.force_authenticate(self.citizen)
        res = self.client.delete(f"/api/notifications/{notification.id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(
            Notification.objects.filter(id=notification.id).exists()
        )

    def test_cannot_delete_others_notification(self):
        notification = self._create_notification(recipient=self.citizen)
        self.client.force_authenticate(self.citizen2)
        res = self.client.delete(f"/api/notifications/{notification.id}/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_delete_unauthenticated(self):
        notification = self._create_notification(recipient=self.citizen)
        res = self.client.delete(f"/api/notifications/{notification.id}/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_nonexistent_notification(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.delete("/api/notifications/999/")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class NotificationSignalTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.citizen2 = User.objects.create_user(
            email="citizen2@test.com",
            full_name="Citizen Two",
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
            title="Pothole",
            description="Big pothole",
            category="roads",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            visibility=True,
        )

    # --- Comment signal ---

    def test_comment_creates_notification_for_report_owner(self):
        Comment.objects.create(
            report=self.report, user=self.citizen2, content="Nice report"
        )
        self.assertEqual(Notification.objects.count(), 1)
        n = Notification.objects.first()
        self.assertEqual(n.recipient, self.citizen)
        self.assertEqual(n.actor, self.citizen2)
        self.assertEqual(n.type, Notification.Type.COMMENT)
        self.assertEqual(n.report, self.report)

    def test_comment_does_not_notify_self(self):
        Comment.objects.create(
            report=self.report, user=self.citizen, content="My own comment"
        )
        self.assertEqual(Notification.objects.count(), 0)

    def test_comment_notification_title_and_message(self):
        Comment.objects.create(
            report=self.report, user=self.citizen2, content="Nice report"
        )
        n = Notification.objects.first()
        self.assertEqual(n.title, "New Comment")
        self.assertEqual(n.message, f"{self.citizen2.full_name} commented on your report.")

    # --- Upvote signal ---

    def test_upvote_creates_notification_for_report_owner(self):
        Upvote.objects.create(report=self.report, user=self.citizen2)
        self.assertEqual(Notification.objects.count(), 1)
        n = Notification.objects.first()
        self.assertEqual(n.recipient, self.citizen)
        self.assertEqual(n.actor, self.citizen2)
        self.assertEqual(n.type, Notification.Type.UPVOTE)
        self.assertEqual(n.report, self.report)

    def test_upvote_does_not_notify_self(self):
        Upvote.objects.create(report=self.report, user=self.citizen)
        self.assertEqual(Notification.objects.count(), 0)

    def test_upvote_notification_title_and_message(self):
        Upvote.objects.create(report=self.report, user=self.citizen2)
        n = Notification.objects.first()
        self.assertEqual(n.title, "New Upvote")
        self.assertEqual(n.message, f"{self.citizen2.full_name} upvoted your report.")

    # --- Status update signal ---

    def test_status_update_creates_notification(self):
        self.report.status = Report.Status.IN_REVIEW
        self.report.save(update_fields=["status"])
        self.assertEqual(Notification.objects.count(), 1)
        n = Notification.objects.first()
        self.assertEqual(n.recipient, self.citizen)
        self.assertIsNone(n.actor)
        self.assertEqual(n.type, Notification.Type.STATUS_UPDATE)
        self.assertEqual(n.report, self.report)

    def test_status_update_notification_title_and_message(self):
        self.report.status = Report.Status.IN_REVIEW
        self.report.save(update_fields=["status"])
        n = Notification.objects.first()
        self.assertEqual(n.title, "Report Status Updated")
        self.assertEqual(n.message, "Your report status changed to In Review.")

    def test_status_update_no_notification_on_initial_creation(self):
        Report.objects.create(
            citizen=self.citizen,
            title="Another",
            description="Desc",
            category="roads",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
        )
        self.assertEqual(Notification.objects.count(), 0)

    def test_status_update_no_notification_if_unchanged(self):
        self.report.save(update_fields=["updated_at"])
        self.assertEqual(Notification.objects.count(), 0)

    # --- Progress update signal ---

    def test_progress_update_creates_notification(self):
        self.report.progress_notes = "[2024-01-01] Inspected"
        self.report.save(update_fields=["progress_notes"])
        self.assertEqual(Notification.objects.count(), 1)
        n = Notification.objects.first()
        self.assertEqual(n.recipient, self.citizen)
        self.assertIsNone(n.actor)
        self.assertEqual(n.type, Notification.Type.PROGRESS_UPDATE)
        self.assertEqual(n.report, self.report)

    def test_progress_update_notification_title_and_message(self):
        self.report.progress_notes = "[2024-01-01] Inspected"
        self.report.save(update_fields=["progress_notes"])
        n = Notification.objects.first()
        self.assertEqual(n.title, "Progress Update")
        self.assertEqual(n.message, "An official added a progress update to your report.")

    def test_progress_update_no_notification_if_unchanged(self):
        self.report.save(update_fields=["updated_at"])
        self.assertEqual(Notification.objects.count(), 0)

    # --- Combined signal behavior ---

    def test_multiple_notifications_for_different_actions(self):
        Comment.objects.create(
            report=self.report, user=self.citizen2, content="Nice"
        )
        Upvote.objects.create(report=self.report, user=self.citizen2)
        self.assertEqual(Notification.objects.count(), 2)

    def test_notifications_use_correct_types(self):
        Comment.objects.create(
            report=self.report, user=self.citizen2, content="Nice"
        )
        Upvote.objects.create(report=self.report, user=self.citizen2)
        types = set(
            Notification.objects.values_list("type", flat=True)
        )
        self.assertEqual(types, {"COMMENT", "UPVOTE"})
