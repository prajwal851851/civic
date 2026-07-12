from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from comments.models import Comment
from reports.models import Report


class CommentAPITests(APITestCase):
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
        self.comment_url = f"/api/reports/{self.report.id}/comments/"
        self.create_data = {"content": "This is a test comment"}

    def test_citizen_create_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["content"], self.create_data["content"])
        self.assertEqual(res.data["author_name"], self.citizen.full_name)

    def test_official_create_comment(self):
        self.client.force_authenticate(self.official)
        res = self.client.post(self.comment_url, self.create_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_anonymous_cannot_create_comment(self):
        res = self.client.post(self.comment_url, self.create_data)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_list_comments(self):
        self.client.force_authenticate(self.citizen)
        Comment.objects.create(
            report=self.report, user=self.citizen, content="First"
        )
        Comment.objects.create(
            report=self.report, user=self.citizen2, content="Second"
        )
        res = self.client.get(self.comment_url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)

    def test_anonymous_cannot_list_comments(self):
        res = self.client.get(self.comment_url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_citizen_edit_own_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        comment_id = res.data["id"]

        res = self.client.patch(
            f"/api/comments/{comment_id}/", {"content": "Updated content"}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["content"], "Updated content")
        self.assertTrue(res.data["is_edited"])

    def test_citizen_cannot_edit_others_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        comment_id = res.data["id"]

        self.client.force_authenticate(self.citizen2)
        res = self.client.patch(
            f"/api/comments/{comment_id}/", {"content": "Hacked"}
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_cannot_edit_others_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        comment_id = res.data["id"]

        self.client.force_authenticate(self.official)
        res = self.client.patch(
            f"/api/comments/{comment_id}/", {"content": "Official edit"}
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_citizen_delete_own_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        comment_id = res.data["id"]

        res = self.client.delete(f"/api/comments/{comment_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_citizen_cannot_delete_others_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        comment_id = res.data["id"]

        self.client.force_authenticate(self.citizen2)
        res = self.client.delete(f"/api/comments/{comment_id}/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_official_can_delete_any_comment(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        comment_id = res.data["id"]

        self.client.force_authenticate(self.official)
        res = self.client.delete(f"/api/comments/{comment_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_create_comment_content_required(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, {})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_comment_max_length(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(
            self.comment_url, {"content": "x" * 1001}
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_nested_reply(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        parent_id = res.data["id"]

        res = self.client.post(
            self.comment_url,
            {"content": "A reply", "parent": parent_id},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["parent"], parent_id)

    def test_replies_appear_nested(self):
        self.client.force_authenticate(self.citizen)
        self.client.post(self.comment_url, self.create_data)
        parent_id = Comment.objects.first().id

        self.client.post(
            self.comment_url,
            {"content": "Reply 1", "parent": parent_id},
        )
        self.client.post(
            self.comment_url,
            {"content": "Reply 2", "parent": parent_id},
        )

        res = self.client.get(self.comment_url)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(len(res.data[0]["replies"]), 2)

    def test_reply_to_reply_not_allowed(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(self.comment_url, self.create_data)
        parent_id = res.data["id"]

        res = self.client.post(
            self.comment_url,
            {"content": "First reply", "parent": parent_id},
        )
        reply_id = res.data["id"]

        res = self.client.post(
            self.comment_url,
            {"content": "Nested reply", "parent": reply_id},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_comment_list_includes_author_details(self):
        self.client.force_authenticate(self.citizen)
        self.client.post(self.comment_url, self.create_data)
        res = self.client.get(self.comment_url)
        item = res.data[0]
        self.assertIn("author_name", item)
        self.assertIn("author_profile_picture", item)
        self.assertIn("is_edited", item)
        self.assertFalse(item["is_edited"])

    def test_comment_on_nonexistent_report(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post(
            "/api/reports/999/comments/", self.create_data
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_parent_comment_must_belong_to_same_report(self):
        self.client.force_authenticate(self.citizen)
        other_report = Report.objects.create(
            citizen=self.citizen,
            title="Other",
            description="Other report",
            category="other",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=1,
            visibility=True,
        )
        other_comment = Comment.objects.create(
            report=other_report,
            user=self.citizen,
            content="From other report",
        )
        res = self.client.post(
            self.comment_url,
            {
                "content": "Invalid parent",
                "parent": other_comment.id,
            },
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
