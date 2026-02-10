import pytz
from datetime import datetime, time
from django.utils import timezone
from apps.user.models import User

def get_user_tz(user):
    if getattr(user, "timezone", None):
        try:
            return pytz.timezone(user.timezone)
        except Exception:
            pass

    if getattr(user, "country", None):
        tz_name = User.COUNTRY_TIMEZONE_MAP.get(user.country)
        if tz_name:
            return pytz.timezone(tz_name)

    return pytz.UTC

def to_user_local_dt(user, dt):
    return timezone.localtime(dt, get_user_tz(user))

def get_user_local_date(user, dt):
    return to_user_local_dt(user, dt).date()

def get_day_range(user, date):
    tz = get_user_tz(user)
    start = tz.localize(datetime.combine(date, time.min))
    end = tz.localize(datetime.combine(date, time.max))
    return start, end
