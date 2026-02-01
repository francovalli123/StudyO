from django.db import transaction
from .models import PomodoroSession
from utils.datetime import get_user_local_date, get_day_range
from apps.weekly_challenges.models import WeeklyChallenge

@transaction.atomic
def evaluate_weekly_challenge(user, reference_dt):
    current_date = get_user_local_date(user, reference_dt)

    challenge = WeeklyChallenge.objects.select_for_update().filter(
        user=user,
        week_start__lte=current_date,
        week_end__gte=current_date,
        status='active'
    ).first()

    if not challenge:
        return

    day_str = current_date.isoformat()

    if day_str in challenge.completed_days:
        return

    start_dt, end_dt = get_day_range(user, current_date)

    pomodoros_today = PomodoroSession.objects.filter(
        user=user,
        end_time__gte=start_dt,
        end_time__lte=end_dt
    ).count()

    if pomodoros_today >= challenge.required_pomodoros_per_day:
        challenge.completed_days.append(day_str)

        if len(challenge.completed_days) >= challenge.target_days:
            challenge.status = 'completed'

        challenge.save()
