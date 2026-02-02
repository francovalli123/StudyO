from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.routine.rollover_service import perform_weekly_rollover
import logging

logger = logging.getLogger(__name__)
User = get_user_model()


class Command(BaseCommand):
    help = 'Execute weekly rollover for all users: archive objectives and create history records'

    def handle(self, *args, **options):
        """
        Ejecuta el rollover semanal para todos los usuarios.
        
        Este comando se ejecuta automáticamente desde el scheduler APScheduler
        cada lunes a las 00:00 (hora del servidor).
        
        Para cada usuario, realiza:
        1. Detecta si cambió la semana según su timezone
        2. Archiva objetivos activos en WeeklyObjectiveHistory
        3. Limpia la lista activa
        4. Mantiene idempotencia: múltiples ejecuciones no crean duplicados
        """
        users = User.objects.filter(is_active=True)
        total_users = users.count()
        
        self.stdout.write(f'Starting weekly rollover for {total_users} users...')
        
        rollover_count = 0
        error_count = 0
        
        for user in users:
            try:
                result = perform_weekly_rollover(user)
                
                if result["performed"]:
                    rollover_count += 1
                    archived = result.get("archived_count", 0)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"✓ {user.username}: Rolled over {archived} objectives "
                            f"({result['week_start']} to {result['week_end']})"
                        )
                    )
                    
                    if result.get("errors"):
                        error_count += len(result["errors"])
                        for error in result["errors"]:
                            self.stdout.write(
                                self.style.WARNING(f"  Warning: {error}")
                            )
                else:
                    self.stdout.write(f"○ {user.username}: No rollover needed")
                    
            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f"✗ {user.username}: {str(e)}")
                )
                logger.error(f"Rollover error for user {user.username}: {e}")
        
        # Resumen
        self.stdout.write(
            self.style.SUCCESS(
                f'\nWeekly rollover completed: '
                f'{rollover_count} users processed, '
                f'{error_count} errors'
            )
        )
