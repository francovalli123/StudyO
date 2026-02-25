from datetime import timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Event


class EventStatusFlowTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="events-user",
            email="events@example.com",
            password="strong-pass-123",
        )
        self.client.force_authenticate(self.user)

    def _create_event(self, **overrides):
        now = timezone.localtime()
        payload = {
            "user": self.user,
            "title": "Test Event",
            "date": now.date(),
            "type": Event.STUDY_BLOCK,
            "start_time": (now + timedelta(hours=1)).time().replace(microsecond=0),
            "end_time": (now + timedelta(hours=2)).time().replace(microsecond=0),
            "status": Event.Status.PENDING,
        }
        payload.update(overrides)
        return Event.objects.create(**payload)

    def test_complete_action_marks_event_completed(self):
        event = self._create_event()

        response = self.client.patch(reverse("event-complete", args=[event.id]), data={})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.COMPLETED)
        self.assertEqual(response.data["status"], Event.Status.COMPLETED)

    def test_complete_action_rejects_missed_event(self):
        now = timezone.localtime()
        past_end = (now - timedelta(hours=2)).time().replace(microsecond=0)
        event = self._create_event(
            date=now.date(),
            start_time=(now - timedelta(hours=3)).time().replace(microsecond=0),
            end_time=past_end,
            status=Event.Status.PENDING,
        )

        response = self.client.patch(reverse("event-complete", args=[event.id]), data={})

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        event.refresh_from_db()
        self.assertEqual(event.status, Event.Status.MISSED)

    def test_list_endpoint_auto_marks_expired_pending_events(self):
        now = timezone.localtime()
        self._create_event(
            date=now.date() - timedelta(days=1),
            start_time=(now - timedelta(hours=4)).time().replace(microsecond=0),
            end_time=(now - timedelta(hours=3)).time().replace(microsecond=0),
            status=Event.Status.PENDING,
        )

        response = self.client.get(reverse("event-list"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(any(item["status"] == Event.Status.MISSED for item in response.data))
