from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import User


class CitizenSignupTests(APITestCase):
    def test_signup_success(self):
        data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
        }
        res = self.client.post("/api/accounts/signup/", data)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", res.data)
        self.assertIn("refresh", res.data)
        self.assertEqual(res.data["user"]["role"], "citizen")

    def test_signup_email_unique(self):
        User.objects.create_user(
            email="same@example.com",
            username="same@example.com",
            full_name="Existing",
            password="Pass123!",
        )
        data = {
            "email": "same@example.com",
            "full_name": "New User",
            "password": "StrongPass123!",
            "confirm_password": "StrongPass123!",
        }
        res = self.client.post("/api/accounts/signup/", data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_signup_password_mismatch(self):
        data = {
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "StrongPass123!",
            "confirm_password": "DifferentPass!",
        }
        res = self.client.post("/api/accounts/signup/", data)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            username="user@example.com",
            full_name="Test User",
            password="Pass1234!",
        )

    def test_login_success(self):
        res = self.client.post(
            "/api/accounts/login/",
            {"email": "user@example.com", "password": "Pass1234!"},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("access", res.data)

    def test_login_invalid_credentials(self):
        res = self.client.post(
            "/api/accounts/login/",
            {"email": "user@example.com", "password": "wrong"},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class CurrentUserTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@example.com",
            username="user@example.com",
            full_name="Test User",
            password="Pass1234!",
        )

    def test_get_profile_authenticated(self):
        self.client.force_authenticate(self.user)
        res = self.client.get("/api/accounts/me/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "user@example.com")

    def test_get_profile_unauthenticated(self):
        res = self.client.get("/api/accounts/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_update_profile(self):
        self.client.force_authenticate(self.user)
        res = self.client.patch(
            "/api/accounts/me/", {"full_name": "Updated Name"}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["full_name"], "Updated Name")
