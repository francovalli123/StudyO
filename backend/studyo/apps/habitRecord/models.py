from django.db import models
from django.conf import settings
from apps.habits.models import Habit

# Create your models here.
class HabitRecord(models.Model):

    # Atributos 
    habit = models.ForeignKey(
        Habit,
        on_delete=models.CASCADE,
        related_name='records' # Acceso: habits.record.all()
    )
    date = models.DateField() # Fecha de registro, por defecto hoy
    completed = models.BooleanField(default=False) # Si el hábito no se completó ese dia
    notes = models.TextField(blank=True, null=True) # Notas opcionales

    class Meta:
        unique_together = ('habit', 'date') # No pueden haber dos registros para el mismo habito el mismo dia
        ordering = ['-date'] # Los mas recientes primeros 
        indexes = [
            models.Index(fields=['habit', 'date', 'completed'], name='hrec_habit_date_done_idx'),
        ]

    def __str__(self):
        estado = "✔️" if self.completed else "❌"
        return f"{self.habit.name} - {self.date} {estado}"  # Esto es para debuggear 
