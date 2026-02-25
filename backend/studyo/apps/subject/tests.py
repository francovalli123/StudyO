from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.pomodoroSession.models import PomodoroSession
from apps.subject.models import Subject

User = get_user_model()


class SubjectProgressTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="franco", password="clave123")
        self.client.login(username="franco", password="clave123")
        self.subject = Subject.objects.create(user=self.user, name="Matematica", priority=1)

    def test_progress_no_pomodoro_sessions(self):
        url = reverse("subject_list_create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]["progress"], 0)

    def test_progress_with_weekly_pomodoro_minutes(self):
        now = timezone.now()
        PomodoroSession.objects.create(
            user=self.user,
            subject=self.subject,
            start_time=now - timedelta(hours=2),
            end_time=now - timedelta(hours=1),
            duration=120,
        )
        PomodoroSession.objects.create(
            user=self.user,
            subject=self.subject,
            start_time=now - timedelta(minutes=40),
            end_time=now - timedelta(minutes=20),
            duration=80,
        )

        url = reverse("subject_list_create")
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_progress = int((200 / 300) * 100)
        self.assertEqual(response.data[0]["progress"], expected_progress)
