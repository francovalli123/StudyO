from django.db import transaction
from django.utils import timezone
from django.contrib.auth import get_user_model
from apps.pomodoroSession.models import PomodoroSession
from apps.weekly_challenges.evaluators import evaluate_weekly_challenge

User = get_user_model()


@transaction.atomic
def evaluate_weekly_challenge_for_pomodoro(user: User, pomodoro_session: PomodoroSession):
    """
    Evaluate and update the weekly challenge after a pomodoro is created.

    Called in PomodoroSessionCreateView.perform_create()

    Args:
        user: The user who completed the pomodoro
        pomodoro_session: The newly created PomodoroSession
    """
    # Use the pomodoro's end_time as reference
    reference_dt = pomodoro_session.end_time or timezone.now()

    # Evaluate the challenge
    evaluate_weekly_challenge(user, reference_dt)
