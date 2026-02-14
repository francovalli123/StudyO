from django.db import models
from django.conf import settings
from apps.subject.models import Subject

class Event(models.Model):
    # Constantes para tipos de evento
    STUDY_BLOCK = 1
    EXAM = 2
    IMPORTANT_TASK = 3
    PERSONAL = 4

    TYPE_CHOICES = [
        (STUDY_BLOCK, 'Bloque de Estudio'),
        (EXAM, 'Examen'),
        (IMPORTANT_TASK, 'Tarea Importante'),
        (PERSONAL, 'Personal'),
    ]

    # Atributos
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='events'
    )

    title = models.CharField(max_length=200)  # Título del evento
    date = models.DateField()  # Fecha del evento
    type = models.IntegerField(choices=TYPE_CHOICES, default=STUDY_BLOCK)  # Tipo de evento
    start_time = models.TimeField()  # Hora de inicio
    end_time = models.TimeField()  # Hora de fin
    subject = models.ForeignKey(
        Subject,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='events'
    )  # Materia asociada (opcional)
    notes = models.TextField(blank=True, null=True)  # Notas opcionales
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date', 'start_time']  # Ordenar por fecha y hora
        indexes = [
            models.Index(fields=["user", "date", "start_time"], name="events_user_date_time_idx"),
            models.Index(fields=["user", "type"], name="events_user_type_idx"),
        ]

    def __str__(self):
        return f"{self.title} - {self.date} ({self.get_type_display()})"
