from unittest.mock import patch

from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase


class SignupSecurityTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.signup_url = "/api/signup/"
        self.captcha_url = "/api/signup/captcha/"
        self.base_payload = {
            "username": "testuser",
            "email": "test@example.com",
            "password": "StrongPass1",
            "first_name": "Test",
            "last_name": "User",
            "country": "AR",
            "captcha_id": "cid",
            "captcha_answer": "10",
        }

    def test_signup_captcha_endpoint_returns_challenge(self):
        response = self.client.get(self.captcha_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("captcha_id", response.data)
        self.assertIn("captcha_question", response.data)

    @patch("apps.user.serializers.validate_registration_email_or_raise", return_value=None)
    @patch("apps.user.serializers.verify_signup_captcha", return_value=True)
    def test_signup_success_with_valid_security_checks(self, *_mocks):
        response = self.client.post(self.signup_url, self.base_payload, format="json", REMOTE_ADDR="1.2.3.4")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    @patch("apps.user.serializers.validate_registration_email_or_raise", return_value=None)
    @patch("apps.user.serializers.verify_signup_captcha", return_value=False)
    def test_signup_rejects_invalid_captcha(self, *_mocks):
        response = self.client.post(self.signup_url, self.base_payload, format="json", REMOTE_ADDR="1.2.3.4")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("captcha", str(response.data).lower())

    @patch("apps.user.serializers.verify_signup_captcha", return_value=True)
    @patch(
        "apps.user.serializers.validate_registration_email_or_raise",
        side_effect=ValueError("El correo ingresado no existe."),
    )
    def test_signup_rejects_non_existing_email(self, *_mocks):
        response = self.client.post(self.signup_url, self.base_payload, format="json", REMOTE_ADDR="1.2.3.4")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    @patch("apps.user.serializers.validate_registration_email_or_raise", return_value=None)
    @patch("apps.user.serializers.verify_signup_captcha", return_value=True)
    def test_signup_rate_limit_max_three_accounts_per_hour_per_ip(self, *_mocks):
        for idx in range(3):
            payload = {
                **self.base_payload,
                "username": f"user_{idx}",
                "email": f"user_{idx}@example.com",
            }
            response = self.client.post(self.signup_url, payload, format="json", REMOTE_ADDR="8.8.8.8")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        blocked_payload = {
            **self.base_payload,
            "username": "user_4",
            "email": "user_4@example.com",
        }
        blocked_response = self.client.post(
            self.signup_url,
            blocked_payload,
            format="json",
            REMOTE_ADDR="8.8.8.8",
        )
        self.assertEqual(blocked_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
