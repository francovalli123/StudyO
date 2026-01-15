from django.db import models
from django.conf import settings

# Modelo para desafíos semanales
class WeeklyChallenge(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_challenges'
    )
    template_id = models.CharField(max_length=50)  # ID de la plantilla (e.g., 'consistency_streak')
    parameters = models.JSONField()  # Parámetros específicos del desafío
    progress = models.FloatField(default=0.0)  # Progreso actual, puede ser fraccional
    is_completed = models.BooleanField(default=False)  # Si está completado
    created_at = models.DateTimeField(auto_now_add=True)  # Fecha de creación

    def __str__(self):
        return f"Challenge {self.template_id} for {self.user.username}"

    def increment_progress(self, amount=1):
        """Incrementa el progreso y verifica completación."""
        self.progress += amount
        self.check_completion()
        self.save()

    def check_completion(self):
        """Verifica si el desafío está completado basado en la plantilla."""
        if self.template_id == 'consistency_streak':
            # Para MVP simplificado: asumir que progress representa días cumplidos
            required_days = self.parameters.get('days', 5)
            if self.progress >= required_days:
                self.is_completed = True
        elif self.template_id == 'volume_grind':
            required_pomodoros = self.parameters.get('total_pomodoros', 20)
            if self.progress >= required_pomodoros:
                self.is_completed = True
        elif self.template_id == 'deep_focus':
            required = self.parameters.get('pomodoros_per_subject', 10)
            if self.progress >= required:
                self.is_completed = True
        elif self.template_id == 'time_bound':
            required = self.parameters.get('total_pomodoros', 5)
            if self.progress >= required:
                self.is_completed = True
        elif self.template_id == 'planner_execution':
            required = self.parameters.get('high_priority_tasks', 3)
            if self.progress >= required:
                self.is_completed = True
