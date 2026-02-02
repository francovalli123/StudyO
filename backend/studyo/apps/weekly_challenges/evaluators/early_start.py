"""
Early Start Challenge Evaluator

Challenge: 1 pomodoro before 10:00 AM for 5 days
"""
from typing import Tuple, Dict
from datetime import time
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_user_tz, to_user_local_dt, get_day_range
from .base import BaseEvaluator


class EarlyStartEvaluator(BaseEvaluator):
    """Evaluator for Early Start challenge: 1 pomodoro before 10:00 AM for 5 days"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Count days with at least 1 pomodoro started before 10:00 AM.

        Returns:
            Tuple of (qualified_days, 5, is_completed)
        """
        tz = get_user_tz(self.user)
        qualified_days = set()

        # Use timezone-aware week boundaries
        start_dt, _ = get_day_range(self.user, self.week_start)
        _, end_dt = get_day_range(self.user, self.week_end)

        # Get all pomodoros in the week
        pomodoros = PomodoroSession.objects.filter(
            user=self.user,
            start_time__gte=start_dt,
            start_time__lte=end_dt
        )

        # Check if each pomodoro starts before 10:00 AM
        for pomodoro in pomodoros:
            local_start = to_user_local_dt(self.user, pomodoro.start_time)
            if local_start.time() < time(10, 0):
                qualified_days.add(local_start.date())

        target = 5.0
        is_completed = len(qualified_days) >= target

        return float(len(qualified_days)), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        return {
            'title': '🌅 Madrugador',
            'description': 'Completa 1 pomodoro antes de las 10:00 AM durante 5 días. ¡Empieza fuerte!'
        }
