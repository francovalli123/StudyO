"""
Deep Work Challenge Evaluator

Challenge: 2 sessions >= 50 min per day for 4 days
"""
from typing import Tuple, Dict
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_day_range, to_user_local_dt
from .base import BaseEvaluator


class DeepWorkEvaluator(BaseEvaluator):
    """Evaluator for Focus Deep Work challenge: 2 sessions >= 50 min per day for 4 days"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Count days with at least 2 sessions of 50+ minutes each.

        Returns:
            Tuple of (qualified_days, 4, is_completed)
        """
        start_dt, _ = get_day_range(self.user, self.week_start)
        _, end_dt = get_day_range(self.user, self.week_end)

        # Single query for the whole week; group per local day in Python.
        sessions = PomodoroSession.objects.filter(
            user=self.user,
            start_time__gte=start_dt,
            start_time__lte=end_dt
        ).only("start_time", "duration")

        per_day_long_sessions = {}
        for session in sessions:
            if session.duration < 50:
                continue
            local_day = to_user_local_dt(self.user, session.start_time).date()
            per_day_long_sessions[local_day] = per_day_long_sessions.get(local_day, 0) + 1

        qualified_days = sum(1 for count in per_day_long_sessions.values() if count >= 2)

        target = 4.0
        is_completed = qualified_days >= target

        return float(qualified_days), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        language = (getattr(self.user, 'language', 'es') or 'es').split('-')[0]
        metadata = {
            'es': {
                'title': '🧠 Trabajo Profundo',
                'description': 'Realiza 2 sesiones de 50+ minutos en 4 días diferentes. ¡Enfócate intensamente!'
            },
            'en': {
                'title': '🧠 Deep Work',
                'description': 'Complete 2 sessions of 50+ minutes on 4 different days. Focus intensely!'
            },
            'zh': {
                'title': '🧠 深度工作',
                'description': '在 4 天内完成 2 次 50+ 分钟的专注。全力投入！'
            },
            'pt': {
                'title': '🧠 Trabalho Profundo',
                'description': 'Realize 2 sessões de 50+ minutos em 4 dias diferentes. Foque intensamente!'
            },
        }
        return metadata.get(language, metadata['es'])
