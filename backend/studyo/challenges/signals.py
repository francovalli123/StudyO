from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.pomodoroSession.models import PomodoroSession
from apps.routine.models import WeeklyObjective  # Asumiendo que es la Task
from .models import WeeklyChallenge
from .engines import ChallengeEngine

@receiver(post_save, sender=PomodoroSession)
def update_challenge_on_pomodoro(sender, instance, created, **kwargs):
    """
    Signal que se activa cuando se crea una sesión de pomodoro.
    Actualiza el progreso de los desafíos activos del usuario.
    """
    if created:  # Solo para nuevas sesiones
        user = instance.user
        # Obtener desafío activo (asumiendo uno por usuario por semana)
        challenge = WeeklyChallenge.objects.filter(
            user=user,
            is_completed=False
        ).first()
        if challenge:
            ChallengeEngine.update_progress_on_pomodoro(challenge, instance)

@receiver(post_save, sender=WeeklyObjective)
def update_challenge_on_task_completion(sender, instance, created, **kwargs):
    """
    Signal que se activa cuando se guarda una WeeklyObjective (Task).
    Si se marca como completada, actualiza progreso.
    """
    if instance.is_completed and not created:  # Solo si se completó y no es nueva
        user = instance.user
        challenge = WeeklyChallenge.objects.filter(
            user=user,
            is_completed=False
        ).first()
        if challenge:
            ChallengeEngine.update_progress_on_task_completion(challenge, instance)