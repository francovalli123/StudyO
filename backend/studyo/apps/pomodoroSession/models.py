from django.db import models
from django.conf import settings
from apps.subject.models import Subject

# Modelo sesion pomodoro
class PomodoroSession(models.Model):
    # Atributos 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, # Esto hace que si se borra el usuario, se borren todos los habitos del mismo
        related_name='pomodoro_sessions' # Acceso inverso: user.pomodoro_sessions.all()
    )
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='pomodoro_sessions') # Materia asociada a la sesión de pomodoro
    start_time = models.DateTimeField() # Fecha de inicio obligatoria
    end_time = models.DateTimeField() # Fecha de fin obligatoria
    duration = models.IntegerField()  # Duracion en minutos
    notes = models.TextField(blank=True) # Notas, opcional

    def __str__(self):
        return f"Pomodoro de {self.user.username} desde {self.start_time} hasta {self.end_time}" # Para debuggear
