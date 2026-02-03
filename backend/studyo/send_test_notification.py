import os
import sys
from django.utils import timezone

# Ensure settings are loaded
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'studyo.settings')
import django
django.setup()

from apps.user.models import User
from apps.notification.services import send_notification_email

TARGET_EMAIL = 'frankovalli123@gmail.com'

print('Looking up user by email:', TARGET_EMAIL)
user = User.objects.filter(email=TARGET_EMAIL).first()
if not user:
    print('User not found with email', TARGET_EMAIL)
    sys.exit(2)

print('Found user:', user.username, user.email)

# Try to find a key habit not completed today
from utils.datetime import get_user_local_date
from django.utils import timezone
from apps.habits.models import Habit
from apps.habitRecord.models import HabitRecord

now = timezone.now()
today = get_user_local_date(user, now)

habit = user.habits.filter(is_key=True).first()
context = {
    'habit_name': getattr(habit, 'name', 'Hábito'),
    'habit_description': getattr(habit, 'description', '') or '',
    'habit_frequency': getattr(habit, 'get_frequency_display', lambda: '')(),
    'metadata': {},
}

print('Sending notification email to user...')
notif = send_notification_email(user, 'key_habit_reminder', f"Recordatorio: {context['habit_name']} - Hábito Clave", 'key_habit_reminder', context)
if notif:
    print('Notification recorded with pk:', notif.pk)
    sys.exit(0)
else:
    print('Failed to send notification')
    sys.exit(1)
