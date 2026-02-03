from django.shortcuts import render
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
        return PomodoroSession.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Save pomodoro and evaluate weekly challenge"""
        pomodoro = serializer.save(user=self.request.user)

        # Only evaluate weekly challenges for newly created sessions.
        # Serializer sets `_created` attribute when returning an existing object.
        created = getattr(pomodoro, '_created', True)
        if created:
            evaluate_weekly_challenge_for_pomodoro(self.request.user, pomodoro)


class PomodoroSessionDetailView(RetrieveUpdateDestroyAPIView):
    """Retrieve, update, and delete a pomodoro session"""
    permission_classes = [IsAuthenticated]
    serializer_class = PomodoroSessionSerializer

    def get_queryset(self):
        """Return pomodoro sessions for the authenticated user"""
        return PomodoroSession.objects.filter(user=self.request.user)
    