"""
Deep Work Challenge Evaluator

Challenge: 2 sessions >= 50 min per day for 4 days
"""
from typing import Tuple, Dict
from datetime import datetime, time
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_user_tz, get_day_range
from .base import BaseEvaluator


class DeepWorkEvaluator(BaseEvaluator):
    """Evaluator for Focus Deep Work challenge: 2 sessions >= 50 min per day for 4 days"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Count days with at least 2 sessions of 50+ minutes each.

        Returns:
            Tuple of (qualified_days, 4, is_completed)
        """
        tz = get_user_tz(self.user)
        qualified_days = 0

        # Iterate through each day of the week
        current_date = self.week_start
        while current_date <= self.week_end:
            # Get all pomodoro sessions for this day
            start_dt, end_dt = get_day_range(self.user, current_date)

            sessions = PomodoroSession.objects.filter(
                user=self.user,
                start_time__gte=start_dt,
                start_time__lte=end_dt
            ).values_list('duration', flat=True)

            # Count sessions with duration >= 50 minutes
            long_sessions = sum(1 for duration in sessions if duration >= 50)

            if long_sessions >= 2:
                qualified_days += 1

            # Move to next day
            current_date = datetime.combine(current_date, time.min).astimezone(tz).date()
            current_date = (datetime.combine(current_date, time.min) + __import__('datetime').timedelta(days=1)).date()

        target = 4.0
        is_completed = qualified_days >= target

        return float(qualified_days), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        return {
            'title': '🧠 Trabajo Profundo',
            'description': 'Realiza 2 sesiones de 50+ minutos en 4 días diferentes. ¡Enfócate intensamente!'
        }
