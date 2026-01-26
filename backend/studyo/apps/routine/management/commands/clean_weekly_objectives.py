from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.routine.models import WeeklyObjective, WeeklyObjectiveHistory


class Command(BaseCommand):
    help = 'Clean weekly objectives older than 7 days and save to history'

    def handle(self, *args, **options):
        # Get objectives older than 7 days
        cutoff_date = timezone.now() - timedelta(days=7)
        old_objectives = WeeklyObjective.objects.filter(created_at__lt=cutoff_date)

        self.stdout.write(f'Found {old_objectives.count()} objectives to clean')

        for objective in old_objectives:
            # Calculate week dates
            created_date = objective.created_at.date()
            days_since_monday = created_date.weekday()  # 0=Monday
            week_start = created_date - timedelta(days=days_since_monday)
            week_end = week_start + timedelta(days=6)

            # Create history record
            history = WeeklyObjectiveHistory.objects.create(
                user=objective.user,
                title=objective.title,
                area=objective.area or 'General',
                priority=objective.priority,
                is_completed=objective.is_completed,
                week_start_date=week_start,
                week_end_date=week_end,
                created_at=objective.created_at,
                completed_at=timezone.now() if objective.is_completed else None
            )

            # Delete the objective
            objective.delete()

            self.stdout.write(f'Cleaned objective: {objective.title}')

        self.stdout.write('Weekly objectives cleanup completed')