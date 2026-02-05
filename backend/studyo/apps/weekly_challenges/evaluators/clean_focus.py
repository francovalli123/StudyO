"""
Clean Focus Challenge Evaluator

Challenge: 5 days without pomodoros < 25 minutes
"""
from typing import Tuple, Dict
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_day_range
from datetime import datetime, time
from .base import BaseEvaluator


class CleanFocusEvaluator(BaseEvaluator):
    """Evaluator for Clean Focus challenge: 5 days without pomodoros < 25 minutes"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Count days where all pomodoros are >= 25 minutes (or no pomodoros that day).

        Returns:
            Tuple of (qualified_days, 5, is_completed)
        """
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

            # Check if all sessions are >= 25 minutes (or no sessions)
            if not sessions or all(duration >= 25 for duration in sessions):
                qualified_days += 1

            # Move to next day
            current_date = (datetime.combine(current_date, time.min) + __import__('datetime').timedelta(days=1)).date()

        target = 5.0
        is_completed = qualified_days >= target

        return float(qualified_days), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        language = (getattr(self.user, 'language', 'es') or 'es').split('-')[0]
        metadata = {
            'es': {
                'title': '🎯 Enfoque Limpio',
                'description': 'Mantén 5 días sin pomodoros menores a 25 minutos. ¡Solo sesiones de calidad!'
            },
            'en': {
                'title': '🎯 Clean Focus',
                'description': 'Keep 5 days without pomodoros under 25 minutes. Quality sessions only!'
            },
            'zh': {
                'title': '🎯 纯净专注',
                'description': '保持 5 天不出现少于 25 分钟的番茄钟。只做高质量专注！'
            },
            'pt': {
                'title': '🎯 Foco Limpo',
                'description': 'Mantenha 5 dias sem pomodoros abaixo de 25 minutos. Apenas sessões de qualidade!'
            },
        }
        return metadata.get(language, metadata['es'])
