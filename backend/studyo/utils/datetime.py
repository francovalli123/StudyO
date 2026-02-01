import pytz
from datetime import datetime, time
from django.utils import timezone

def get_user_tz(user):
    return pytz.timezone(user.timezone)

def to_user_local_dt(user, dt):
    return timezone.localtime(dt, get_user_tz(user))

def get_user_local_date(user, dt):
    return to_user_local_dt(user, dt).date()

def get_day_range(user, date):
    tz = get_user_tz(user)
    start = tz.localize(datetime.combine(date, time.min))
    end = tz.localize(datetime.combine(date, time.max))
    return start, end
