from datetime import timedelta
from .models import WeeklyChallenge
from utils.datetime import get_user_local_date

def get_week_start(user, dt):
    local_date = get_user_local_date(user, dt)
    return local_date - timedelta(days=local_date.weekday())

def create_weekly_challenge_if_needed(user, dt):
    week_start = get_week_start(user, dt)
    week_end = week_start + timedelta(days=6)

    WeeklyChallenge.objects.get_or_create(
        user=user,
        week_start=week_start,
        defaults={
            'week_end': week_end,
            'target_days': 5,
            'required_pomodoros_per_day': 5
        }
    )

