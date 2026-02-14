from django.shortcuts import render
from django.db import transaction
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from apps.pomodoroSession.services import evaluate_weekly_challenge_for_pomodoro
from .serializers import PomodoroSessionSerializer
from .models import PomodoroSession


class PomodoroSessionCreateView(ListCreateAPIView):
    """List and create pomodoro sessions for the authenticated user"""
    permission_classes = [IsAuthenticated]
    serializer_class = PomodoroSessionSerializer

    def get_queryset(self):
        """Return pomodoro sessions for the authenticated user"""
        return (
            PomodoroSession.objects
            .filter(user=self.request.user)
            .select_related("subject")
            .only(
                "id", "user_id", "subject_id", "start_time", "end_time", "duration", "notes",
                "subject__id", "subject__name",
            )
            .order_by("-start_time")
        )

    def perform_create(self, serializer):
        """Save pomodoro and evaluate weekly challenge"""
        with transaction.atomic():
            pomodoro = serializer.save(user=self.request.user)

            # Run challenge evaluation after commit to keep the transaction
            # short and reduce lock time on write-heavy endpoints.
            created = getattr(pomodoro, "_created", True)
            if created:
                transaction.on_commit(
                    lambda: evaluate_weekly_challenge_for_pomodoro(self.request.user, pomodoro)
                )


class PomodoroSessionDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete a pomodoro session"""
    permission_classes = [IsAuthenticated]
    serializer_class = PomodoroSessionSerializer

    def get_queryset(self):
        """Return pomodoro sessions for the authenticated user"""
        return (
            PomodoroSession.objects
            .filter(user=self.request.user)
            .select_related("subject")
            .only(
                "id", "user_id", "subject_id", "start_time", "end_time", "duration", "notes",
                "subject__id", "subject__name",
            )
        )
    
