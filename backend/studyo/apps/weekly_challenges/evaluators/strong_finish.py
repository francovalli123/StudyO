"""
Strong Finish Challenge Evaluator

Challenge: 1 pomodoro after 18:00 for 4 days
"""
from typing import Tuple, Dict
from django.db.models.functions import ExtractHour, TruncDate
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_user_tz, get_day_range
from .base import BaseEvaluator


class StrongFinishEvaluator(BaseEvaluator):
    """Evaluator for Strong Finish challenge: 1 pomodoro after 18:00 for 4 days"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Count days with at least 1 pomodoro started after 18:00.

        Returns:
            Tuple of (qualified_days, 4, is_completed)
        """
        tz = get_user_tz(self.user)
        # Use timezone-aware week boundaries
        start_dt, _ = get_day_range(self.user, self.week_start)
        _, end_dt = get_day_range(self.user, self.week_end)

        qualified_days = (
            PomodoroSession.objects.filter(
                user=self.user,
                start_time__gte=start_dt,
                start_time__lte=end_dt
            )
            .annotate(
                local_hour=ExtractHour("start_time", tzinfo=tz),
                local_day=TruncDate("start_time", tzinfo=tz),
            )
            .filter(local_hour__gte=18)
            .values("local_day")
            .distinct()
            .count()
        )

        target = 4.0
        is_completed = qualified_days >= target

        return float(qualified_days), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        language = (getattr(self.user, 'language', 'es') or 'es').split('-')[0]
        metadata = {
            'es': {
                'title': '🌆 Cierre Fuerte',
                'description': 'Completa 1 pomodoro después de las 18:00 durante 4 días. ¡Termina con energía!'
            },
            'en': {
                'title': '🌆 Strong Finish',
                'description': 'Complete 1 pomodoro after 6:00 PM for 4 days. Finish with energy!'
            },
            'zh': {
                'title': '🌆 强力收尾',
                'description': '连续 4 天在 18:00 后完成 1 个番茄钟。能量收官！'
            },
            'pt': {
                'title': '🌆 Fechamento Forte',
                'description': 'Complete 1 pomodoro após as 18:00 por 4 dias. Termine com energia!'
            },
        }
        return metadata.get(language, metadata['es'])
