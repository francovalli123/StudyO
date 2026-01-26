import pytz
from datetime import timedelta
from django.utils import timezone


def get_user_timezone(user):
    try:
        return pytz.timezone(user.timezone)
    except Exception:
        return pytz.UTC


def get_user_week_range(user):
    user_tz = get_user_timezone(user)
    now = timezone.now().astimezone(user_tz)

    days_since_monday = now.weekday()  # Monday = 0
    week_start_local = (now - timedelta(days=days_since_monday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    week_end_local = week_start_local + timedelta(days=6, hours=23, minutes=59, seconds=59)

    return {
        "week_start_local": week_start_local,
        "week_end_local": week_end_local,
        "week_start_utc": week_start_local.astimezone(pytz.UTC),
        "week_end_utc": week_end_local.astimezone(pytz.UTC),
    }
