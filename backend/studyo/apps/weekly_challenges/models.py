from django.db import models
from django.conf import settings

class WeeklyChallenge(models.Model):
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_challenges'
    )

    week_start = models.DateField()
    week_end = models.DateField()

    target_days = models.PositiveSmallIntegerField(default=5)
    required_pomodoros_per_day = models.PositiveSmallIntegerField(default=5)

    completed_days = models.JSONField(default=list)

    status = models.CharField(
        max_length=10,
        choices=STATUS_CHOICES,
        default='active'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'week_start')

    def __str__(self):
        return f"{self.user} - {self.week_start}"
    
    def get_title(self):
        """Generate dynamic challenge title based on requirements"""
        return f"Racha de Enfoque Élite - {self.required_pomodoros_per_day} Pomodoros/día"
    
    def get_description(self):
        """Generate dynamic challenge description"""
        return f"Completá {self.required_pomodoros_per_day} Pomodoros diarios por {self.target_days} días seguidos. ¡Demuestra tu consistencia!"
