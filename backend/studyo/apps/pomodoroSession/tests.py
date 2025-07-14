from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.pomodoroSession.models import PomodoroSession
from apps.subject.models import Subject
from datetime import datetime, timedelta
from rest_framework import status

User = get_user_model()

class PomodoroSessionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='123456')
        self.client.login(username='testuser', password='123456')
        self.subject = Subject.objects.create(user=self.user, name="Matemática", priority=1)

        self.session_data = {
            "subject": self.subject.id,
            "start_time": datetime.now().isoformat(),
            "end_time": (datetime.now() + timedelta(minutes=25)).isoformat(),
            "duration": 25,
            "notes": "Estudié funciones."
        }

    def test_create_pomodoro_session(self):
        url = reverse('pomodoro_list_create')  # Asegurate de tener este name en tus urls
        response = self.client.post(url, self.session_data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PomodoroSession.objects.count(), 1)
        self.assertEqual(PomodoroSession.objects.first().duration, 25)

    def test_list_pomodoro_sessions(self):
        PomodoroSession.objects.create(
            user=self.user,
            subject=self.subject,
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(minutes=25),
            duration=25,
            notes="Sesión 1"
        )

        url = reverse('pomodoro_list_create')
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['notes'], "Sesión 1")

    def test_retrieve_pomodoro_session_detail(self):
        session = PomodoroSession.objects.create(
            user=self.user,
            subject=self.subject,
            start_time=datetime.now(),
            end_time=datetime.now() + timedelta(minutes=25),
            duration=25,
            notes="Detalle"
        )

        url = reverse('pomodoro_detail', args=[session.id])  # Asegurate de tener este name también
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['notes'], "Detalle")
