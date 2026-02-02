"""
Quality Over Quantity Challenge Evaluator

Challenge: Weekly average >= 40 minutes per pomodoro
"""
from typing import Tuple, Dict
from django.db.models import Avg
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_day_range
from .base import BaseEvaluator


class QualityEvaluator(BaseEvaluator):
    """Evaluator for Quality Over Quantity challenge: average >= 40 min per pomodoro"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Calculate the average duration of pomodoros in the week.

        Returns:
            Tuple of (average_duration, 40.0, is_completed)
        """
        start_dt, _ = get_day_range(self.user, self.week_start)
        _, end_dt = get_day_range(self.user, self.week_end)

        average_duration = PomodoroSession.objects.filter(
            user=self.user,
            start_time__gte=start_dt,
            start_time__lte=end_dt
        ).aggregate(avg_duration=Avg('duration'))['avg_duration']

        # If no pomodoros, average is 0
        average_duration = average_duration or 0.0

        target = 40.0
        is_completed = average_duration >= target

        return float(average_duration), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        return {
            'title': '⚡ Calidad Sobre Cantidad',
            'description': 'Mantén un promedio de 40+ minutos por pomodoro. ¡Sesiones profundas!'
        }
