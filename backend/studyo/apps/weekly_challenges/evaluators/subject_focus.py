"""
Subject Focus Challenge Evaluator

Challenge: 10 pomodoros in the same subject
"""
from typing import Tuple, Dict
from django.db.models import Count
from apps.pomodoroSession.models import PomodoroSession
from utils.datetime import get_day_range
from .base import BaseEvaluator


class SubjectFocusEvaluator(BaseEvaluator):
    """Evaluator for Subject Focus challenge: 10 pomodoros in one subject"""

    def evaluate(self) -> Tuple[float, float, bool]:
        """
        Find the subject with the most pomodoros.

        Returns:
            Tuple of (max_pomodoros_in_subject, 10, is_completed)
        """
        # Use timezone-aware week boundaries
        start_dt, _ = get_day_range(self.user, self.week_start)
        _, end_dt = get_day_range(self.user, self.week_end)

        # Get count of pomodoros per subject
        top_subject = PomodoroSession.objects.filter(
            user=self.user,
            start_time__gte=start_dt,
            start_time__lte=end_dt,
            subject__isnull=False
        ).values('subject').annotate(count=Count('id')).order_by('-count').first()

        max_pomodoros = top_subject["count"] if top_subject else 0

        target = 10.0
        is_completed = max_pomodoros >= target

        return float(max_pomodoros), target, is_completed

    def get_metadata(self) -> Dict[str, str]:
        """Get challenge title and description"""
        language = (getattr(self.user, 'language', 'es') or 'es').split('-')[0]
        metadata = {
            'es': {
                'title': '📚 Enfoque en Materia',
                'description': 'Completa 10 pomodoros en una misma materia. ¡Domina el tema!'
            },
            'en': {
                'title': '📚 Subject Focus',
                'description': 'Complete 10 pomodoros in one subject. Master the topic!'
            },
            'zh': {
                'title': '📚 专注单科',
                'description': '在同一科目完成 10 个番茄钟。精通该主题！'
            },
            'pt': {
                'title': '📚 Foco na Matéria',
                'description': 'Complete 10 pomodoros em uma mesma matéria. Domine o tema!'
            },
        }
        return metadata.get(language, metadata['es'])
