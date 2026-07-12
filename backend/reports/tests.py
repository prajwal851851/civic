from io import BytesIO
from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile

from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User
from reports.models import Report


class ReportAPITests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.official = User.objects.create_user(
            email="official@test.com",
            full_name="Official User",
            password="Pass1234!",
            role=User.Role.OFFICIAL,
        )
        self.report_data = {
            "title": "Pothole on Main Road",
            "description": "Large pothole near the market",
            "category": "roads",
            "latitude": "27.7172",
            "longitude": "85.3240",
            "municipality": "Kathmandu",
            "ward_number": 5,
            "address": "Main Road, Near Market",
        }

    def test_citizen_create_report(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post("/api/reports/", self.report_data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["citizen"], self.citizen.id)
        self.assertEqual(res.data["title"], self.report_data["title"])

    def test_unauthenticated_cannot_create(self):
        res = self.client.post("/api/reports/", self.report_data)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_official_cannot_create(self):
        self.client.force_authenticate(self.official)
        res = self.client.post("/api/reports/", self.report_data)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_citizen_list_own_reports(self):
        self.client.force_authenticate(self.citizen)
        Report.objects.create(citizen=self.citizen, **self.report_data)
        res = self.client.get("/api/reports/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_citizen_my_reports(self):
        self.client.force_authenticate(self.citizen)
        Report.objects.create(citizen=self.citizen, **self.report_data)
        res = self.client.get("/api/reports/my/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)

    def test_official_update_status(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post("/api/reports/", self.report_data)
        report_id = res.data["id"]

        self.client.force_authenticate(self.official)
        res = self.client.patch(
            f"/api/reports/{report_id}/status/",
            {"status": "in_review"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["status"], "in_review")

    def test_official_add_progress(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post("/api/reports/", self.report_data)
        report_id = res.data["id"]

        self.client.force_authenticate(self.official)
        res = self.client.post(
            f"/api/reports/{report_id}/progress/",
            {"note": "Inspected the site"},
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("Inspected the site", res.data["progress_notes"])

    def test_citizen_update_own_report(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post("/api/reports/", self.report_data)
        report_id = res.data["id"]

        res = self.client.patch(
            f"/api/reports/{report_id}/",
            {"title": "Updated Title"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["title"], "Updated Title")

    def test_citizen_delete_own_report(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.post("/api/reports/", self.report_data)
        report_id = res.data["id"]

        res = self.client.delete(f"/api/reports/{report_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_citizen_cannot_delete_others_report(self):
        other = User.objects.create_user(
            email="other@test.com",
            full_name="Other Citizen",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.client.force_authenticate(other)
        res = self.client.post("/api/reports/", self.report_data)
        report_id = res.data["id"]

        self.client.force_authenticate(self.citizen)
        res = self.client.delete(f"/api/reports/{report_id}/")
        self.assertIn(res.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))


class FeedAPITests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.official = User.objects.create_user(
            email="official@test.com",
            full_name="Official User",
            password="Pass1234!",
            role=User.Role.OFFICIAL,
        )
        self.report1 = Report.objects.create(
            citizen=self.citizen,
            title="Pothole on Main Road",
            description="Large pothole near the market",
            category="roads",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            address="Main Road, Near Market",
            visibility=True,
        )
        self.report2 = Report.objects.create(
            citizen=self.citizen,
            title="Broken Street Light",
            description="Light not working on Station Road",
            category="street_lights",
            latitude="27.7180",
            longitude="85.3250",
            municipality="Lalitpur",
            ward_number=3,
            address="Station Road, Sector 7",
            visibility=True,
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Hidden Report",
            description="Should not appear in feed",
            category="other",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            address="Hidden Lane",
            visibility=False,
        )

    # --- Basic access ---

    def test_feed_returns_public_reports_only(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 2)

    def test_feed_anonymous_forbidden(self):
        res = self.client.get("/api/feed/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_feed_citizen_can_access(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_feed_official_can_access(self):
        self.client.force_authenticate(self.official)
        res = self.client.get("/api/feed/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    # --- Sorting ---

    def test_sort_default_newest(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Broken Street Light", "Pothole on Main Road"])

    def test_sort_newest(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=newest")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Broken Street Light", "Pothole on Main Road"])

    def test_sort_oldest(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=oldest")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Pothole on Main Road", "Broken Street Light"])

    def test_sort_most_upvoted(self):
        from upvotes.models import Upvote

        Upvote.objects.create(report=self.report1, user=self.official)
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=most_upvoted")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Pothole on Main Road", "Broken Street Light"])

    def test_sort_most_upvoted_ties_by_newest(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=most_upvoted")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(len(titles), 2)

    def test_sort_most_commented(self):
        from comments.models import Comment

        Comment.objects.create(
            report=self.report1, user=self.official, content="Nice"
        )
        Comment.objects.create(
            report=self.report1, user=self.official, content="Also nice"
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=most_commented")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Pothole on Main Road", "Broken Street Light"])

    def test_sort_most_commented_ties_by_newest(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=most_commented")
        self.assertEqual(len(res.data["results"]), 2)

    def test_sort_recently_updated(self):
        import datetime

        Report.objects.filter(pk=self.report1.pk).update(
            updated_at=datetime.datetime(2025, 1, 1, tzinfo=datetime.timezone.utc)
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=recently_updated")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Broken Street Light", "Pothole on Main Road"])

    def test_sort_invalid_fallback_to_newest(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=invalid")
        titles = [r["title"] for r in res.data["results"]]
        self.assertEqual(titles, ["Broken Street Light", "Pothole on Main Road"])

    # --- Filters ---

    def test_filter_by_category(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?category=roads")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["category"], "roads")

    def test_filter_by_status(self):
        self.report1.status = Report.Status.IN_REVIEW
        self.report1.save(update_fields=["status"])
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?status=in_review")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["status"], "in_review")

    def test_filter_by_municipality(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?municipality=Lalitpur")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["municipality"], "Lalitpur")

    def test_filter_by_municipality_case_insensitive(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?municipality=lalitpur")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["municipality"], "Lalitpur")

    def test_filter_by_ward(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?ward=5")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["ward_number"], 5)

    def test_filter_by_ward_no_results(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?ward=99")
        self.assertEqual(len(res.data["results"]), 0)

    # --- Search ---

    def test_search_title(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=pothole")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertIn("Pothole", res.data["results"][0]["title"])

    def test_search_title_case_insensitive(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=POTHOLE")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertIn("Pothole", res.data["results"][0]["title"])

    def test_search_description(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=working")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertIn("working", res.data["results"][0]["description"])

    def test_search_municipality(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=Lalitpur")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["municipality"], "Lalitpur")

    def test_search_address(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=Station+Road")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertIn("Station Road", res.data["results"][0]["address"])

    def test_search_address_case_insensitive(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=station+road")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertIn("Station Road", res.data["results"][0]["address"])

    def test_search_no_results(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?q=nonexistent")
        self.assertEqual(len(res.data["results"]), 0)

    # --- Date range ---

    def test_filter_date_from(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?date_from=2026-01-01")
        self.assertEqual(len(res.data["results"]), 2)

    def test_filter_date_from_excludes_older(self):
        import datetime

        Report.objects.filter(pk=self.report1.pk).update(
            created_at=datetime.datetime(2025, 1, 1, tzinfo=datetime.timezone.utc)
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?date_from=2026-01-01")
        self.assertEqual(len(res.data["results"]), 1)

    def test_filter_date_to(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?date_to=2026-12-31")
        self.assertEqual(len(res.data["results"]), 2)

    def test_filter_date_to_excludes_newer(self):
        import datetime

        Report.objects.filter(pk=self.report2.pk).update(
            created_at=datetime.datetime(2026, 12, 1, tzinfo=datetime.timezone.utc)
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?date_to=2026-06-01")
        self.assertEqual(len(res.data["results"]), 0)

    def test_filter_date_range(self):
        import datetime

        Report.objects.filter(pk=self.report1.pk).update(
            created_at=datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc)
        )
        Report.objects.filter(pk=self.report2.pk).update(
            created_at=datetime.datetime(2026, 6, 1, tzinfo=datetime.timezone.utc)
        )
        Report.objects.create(
            citizen=self.citizen,
            title="Mid Year Report",
            description="Created in between",
            category="roads",
            latitude="27.7172",
            longitude="85.3240",
            municipality="Kathmandu",
            ward_number=5,
            visibility=True,
        )
        Report.objects.filter(title="Mid Year Report").update(
            created_at=datetime.datetime(2026, 3, 15, tzinfo=datetime.timezone.utc)
        )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?date_from=2026-02-01&date_to=2026-04-01")
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["title"], "Mid Year Report")

    def test_filter_date_from_invalid_ignored(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?date_from=not-a-date")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    # --- Combining filters ---

    def test_combine_category_and_municipality(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get(
            "/api/feed/?category=roads&municipality=Kathmandu"
        )
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["category"], "roads")
        self.assertEqual(res.data["results"][0]["municipality"], "Kathmandu")

    def test_combine_all_filters(self):
        from upvotes.models import Upvote

        self.report1.status = Report.Status.IN_REVIEW
        self.report1.save(update_fields=["status"])
        Upvote.objects.create(report=self.report1, user=self.official)
        self.client.force_authenticate(self.citizen)
        res = self.client.get(
            "/api/feed/"
            "?category=roads"
            "&municipality=Kathmandu"
            "&ward=5"
            "&status=in_review"
            "&sort=most_upvoted"
        )
        self.assertEqual(len(res.data["results"]), 1)

    # --- Pagination ---

    def test_pagination_default_page_size(self):
        for i in range(25):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="Pagination test",
                category="other",
                latitude="27.7172",
                longitude="85.3240",
                municipality="Kathmandu",
                ward_number=1,
                visibility=True,
            )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        self.assertEqual(len(res.data["results"]), 20)
        self.assertIsNotNone(res.data["next"])

    def test_pagination_works_with_sort(self):
        for i in range(25):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Report {i}",
                description="Pagination test",
                category="other",
                latitude="27.7172",
                longitude="85.3240",
                municipality="Kathmandu",
                ward_number=1,
                visibility=True,
            )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?sort=oldest")
        self.assertEqual(len(res.data["results"]), 20)
        self.assertIsNotNone(res.data["next"])
        self.assertEqual(res.data["results"][0]["title"], "Pothole on Main Road")

    def test_pagination_works_with_filters(self):
        for i in range(25):
            Report.objects.create(
                citizen=self.citizen,
                title=f"Road Report {i}",
                description="Pagination test",
                category="roads",
                latitude="27.7172",
                longitude="85.3240",
                municipality="Kathmandu",
                ward_number=1,
                visibility=True,
            )
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/?category=roads")
        self.assertEqual(len(res.data["results"]), 20)
        self.assertIsNotNone(res.data["next"])

    # --- Serializer fields ---

    def test_feed_includes_citizen_details(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        item = res.data["results"][0]
        self.assertIn("citizen_name", item)
        self.assertIn("citizen_profile_picture", item)

    def test_feed_includes_counts_and_upvote_status(self):
        self.client.force_authenticate(self.citizen)
        res = self.client.get("/api/feed/")
        item = res.data["results"][0]
        self.assertIn("total_upvotes", item)
        self.assertIn("total_comments", item)
        self.assertIn("has_upvoted", item)
        self.assertEqual(item["total_upvotes"], 0)
        self.assertEqual(item["total_comments"], 0)
        self.assertFalse(item["has_upvoted"])


def _mock_cloudinary_upload(*args, **kwargs):
    return {
        "public_id": f"test/{hash(str(args))}",
        "version": 1234567890,
        "url": "https://res.cloudinary.com/test/image/upload/v1/test.jpg",
        "secure_url": "https://res.cloudinary.com/test/image/upload/v1/test.jpg",
        "format": "jpg",
        "resource_type": kwargs.get("resource_type", "image"),
        "type": "upload",
    }


class MediaUploadTests(APITestCase):
    def setUp(self):
        self.citizen = User.objects.create_user(
            email="citizen@test.com",
            full_name="Citizen User",
            password="Pass1234!",
            role=User.Role.CITIZEN,
        )
        self.client.force_authenticate(self.citizen)
        self.report_data = {
            "title": "Pothole on Main Road",
            "description": "Large pothole near the market",
            "category": "roads",
            "latitude": "27.7172",
            "longitude": "85.3240",
            "municipality": "Kathmandu",
            "ward_number": 5,
            "address": "Main Road, Near Market",
        }

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_upload_single_image(self, mock_upload):
        image = SimpleUploadedFile(
            "test.jpg", b"fake-image-content", content_type="image/jpeg"
        )
        data = self.report_data.copy()
        data["uploaded_images"] = [image]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["images"]), 1)
        self.assertIsInstance(res.data["images"][0]["image"], str)
        self.assertTrue(len(res.data["images"][0]["image"]) > 0)

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_upload_multiple_images_up_to_max(self, mock_upload):
        images = [
            SimpleUploadedFile(f"test{i}.jpg", b"fake", content_type="image/jpeg")
            for i in range(5)
        ]
        data = self.report_data.copy()
        data["uploaded_images"] = images

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["images"]), 5)

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_upload_too_many_images(self, mock_upload):
        images = [
            SimpleUploadedFile(f"test{i}.jpg", b"fake", content_type="image/jpeg")
            for i in range(6)
        ]
        data = self.report_data.copy()
        data["uploaded_images"] = images

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Maximum 5 images", str(res.data))

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_upload_single_video(self, mock_upload):
        video = SimpleUploadedFile(
            "test.mp4", b"fake-video-content", content_type="video/mp4"
        )
        data = self.report_data.copy()
        data["uploaded_videos"] = [video]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["videos"]), 1)

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_upload_too_many_videos(self, mock_upload):
        videos = [
            SimpleUploadedFile(f"test{i}.mp4", b"fake", content_type="video/mp4")
            for i in range(3)
        ]
        data = self.report_data.copy()
        data["uploaded_videos"] = videos

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Maximum 2 videos", str(res.data))

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_upload_images_and_videos_together(self, mock_upload):
        image = SimpleUploadedFile("img.jpg", b"fake", content_type="image/jpeg")
        video = SimpleUploadedFile("vid.mp4", b"fake", content_type="video/mp4")
        data = self.report_data.copy()
        data["uploaded_images"] = [image]
        data["uploaded_videos"] = [video]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["images"]), 1)
        self.assertEqual(len(res.data["videos"]), 1)

    def test_reject_invalid_image_type(self):
        image = SimpleUploadedFile(
            "test.gif", b"fake-gif", content_type="image/gif"
        )
        data = self.report_data.copy()
        data["uploaded_images"] = [image]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid image type", str(res.data))

    def test_reject_invalid_video_type(self):
        video = SimpleUploadedFile(
            "test.mp3", b"fake-audio", content_type="audio/mpeg"
        )
        data = self.report_data.copy()
        data["uploaded_videos"] = [video]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid video type", str(res.data))

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_accept_valid_video_types(self, mock_upload):
        for content_type, ext in [
            ("video/mp4", "mp4"),
            ("video/quicktime", "mov"),
            ("video/webm", "webm"),
        ]:
            video = SimpleUploadedFile(
                f"test.{ext}", b"fake", content_type=content_type
            )
            data = self.report_data.copy()
            data["uploaded_videos"] = [video]
            data["title"] = f"Test {ext}"

            res = self.client.post("/api/reports/", data, format="multipart")
            self.assertEqual(
                res.status_code, status.HTTP_201_CREATED, f"Failed for {ext}"
            )

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    def test_accept_valid_image_types(self, mock_upload):
        for content_type, ext in [
            ("image/jpeg", "jpg"),
            ("image/jpeg", "jpeg"),
            ("image/png", "png"),
            ("image/webp", "webp"),
        ]:
            image = SimpleUploadedFile(
                f"test.{ext}", b"fake", content_type=content_type
            )
            data = self.report_data.copy()
            data["uploaded_images"] = [image]
            data["title"] = f"Test {ext}"

            res = self.client.post("/api/reports/", data, format="multipart")
            self.assertEqual(
                res.status_code, status.HTTP_201_CREATED, f"Failed for {ext}"
            )

    def test_reject_oversized_image(self):
        large_content = b"x" * (10 * 1024 * 1024 + 1)
        image = SimpleUploadedFile(
            "large.jpg", large_content, content_type="image/jpeg"
        )
        data = self.report_data.copy()
        data["uploaded_images"] = [image]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds 10 MB", str(res.data))

    def test_reject_oversized_video(self):
        large_content = b"x" * (50 * 1024 * 1024 + 1)
        video = SimpleUploadedFile(
            "large.mp4", large_content, content_type="video/mp4"
        )
        data = self.report_data.copy()
        data["uploaded_videos"] = [video]

        res = self.client.post("/api/reports/", data, format="multipart")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("exceeds 50 MB", str(res.data))

    @patch("cloudinary.uploader.upload", side_effect=_mock_cloudinary_upload)
    @patch("cloudinary.uploader.destroy")
    def test_delete_report_removes_cloudinary_media(self, mock_destroy, mock_upload):
        image = SimpleUploadedFile(
            "test.jpg", b"fake", content_type="image/jpeg"
        )
        data = self.report_data.copy()
        data["uploaded_images"] = [image]

        res = self.client.post("/api/reports/", data, format="multipart")
        report_id = res.data["id"]

        res = self.client.delete(f"/api/reports/{report_id}/")
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertTrue(mock_destroy.called)

    def test_json_report_creation_still_works(self):
        res = self.client.post("/api/reports/", self.report_data, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["images"], [])
        self.assertEqual(res.data["videos"], [])

    def test_json_report_without_media_returns_empty_lists(self):
        res = self.client.post("/api/reports/", self.report_data, format="json")
        report_id = res.data["id"]

        res = self.client.get(f"/api/reports/{report_id}/")
        self.assertEqual(res.data["images"], [])
        self.assertEqual(res.data["videos"], [])
