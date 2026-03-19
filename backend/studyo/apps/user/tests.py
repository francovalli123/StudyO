from django.contrib.auth import get_user_model
from django.core.cache import cache
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()


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

    def _create_captcha(self):
        response = self.client.get(self.captcha_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        question = response.data["captcha_question"].replace("=", "").strip()
        left, right = [part.strip() for part in question.split("+")]
        answer = str(int(left) + int(right))

        return response.data["captcha_id"], answer

    def _payload(self, **overrides):
        captcha_id, captcha_answer = self._create_captcha()
        payload = {
            **self.base_payload,
            "captcha_id": captcha_id,
            "captcha_answer": captcha_answer,
        }
        payload.update(overrides)
        return payload

    def test_signup_captcha_endpoint_returns_challenge(self):
        response = self.client.get(self.captcha_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("captcha_id", response.data)
        self.assertIn("captcha_question", response.data)

    def test_signup_success_with_valid_email_and_captcha(self):
        response = self.client.post(
            self.signup_url,
            self._payload(),
            format="json",
            REMOTE_ADDR="1.2.3.4",
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(User.objects.filter(email="test@example.com").exists())

    def test_signup_rejects_invalid_captcha(self):
        response = self.client.post(
            self.signup_url,
            self.base_payload,
            format="json",
            REMOTE_ADDR="1.2.3.4",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("captcha", str(response.data).lower())

    def test_signup_rejects_invalid_email_format(self):
        response = self.client.post(
            self.signup_url,
            self._payload(email="correo-invalido"),
            format="json",
            REMOTE_ADDR="1.2.3.4",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"], ["Email inválido"])

    def test_signup_rejects_duplicate_email(self):
        User.objects.create_user(
            username="existing_user",
            email="test@example.com",
            password="StrongPass1",
            country="AR",
        )

        response = self.client.post(
            self.signup_url,
            self._payload(),
            format="json",
            REMOTE_ADDR="1.2.3.4",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["email"], ["El usuario con este email ya existe"])

    def test_signup_rate_limit_max_three_accounts_per_hour_per_ip(self):
        for idx in range(3):
            payload = self._payload(
                username=f"user_{idx}",
                email=f"user_{idx}@example.com",
            )
            response = self.client.post(
                self.signup_url,
                payload,
                format="json",
                REMOTE_ADDR="8.8.8.8",
            )
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        blocked_payload = self._payload(
            username="user_4",
            email="user_4@example.com",
        )
        blocked_response = self.client.post(
            self.signup_url,
            blocked_payload,
            format="json",
            REMOTE_ADDR="8.8.8.8",
        )
        self.assertEqual(blocked_response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)
