"""
Marathon Productivity Challenge Evaluator

Challenge: Complete 20 pomodoros in the week
"""
from typing import Tuple, Dict
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_day_range
from .base import BaseEvaluator


class MarathonEvaluator(BaseEvaluator):
    """Evaluator for Marathon Productivity challenge: 20 pomodoros per week"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Count total pomodoros in the week.

        Returns:
            Tuple of (current_pomodoros, 20, is_completed)
        """
        # Use timezone-aware datetime boundaries for the user's week
        start_dt, _ = get_day_range(self.user, self.week_start)
        _, end_dt = get_day_range(self.user, self.week_end)

        pomodoros = PomodoroSession.objects.filter(
            user=self.user,
            start_time__gte=start_dt,
            start_time__lte=end_dt
        ).count()

        target = 20.0
        is_completed = pomodoros >= target

        return float(pomodoros), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        return {
            'title': '🏃 Maratón de Productividad',
            'description': 'Completa 20 pomodoros durante esta semana. ¡Demuestra tu consistencia!'
        }
