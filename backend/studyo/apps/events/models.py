from datetime import datetime

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils import timezone

from apps.subject.models import Subject

class Event(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pendiente"
        COMPLETED = "completed", "Completado"
        MISSED = "missed", "Vencido"

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
    status = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
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
            models.Index(fields=["user", "status", "date"], name="events_user_status_date_idx"),
        ]

    def __str__(self):
        return f"{self.title} - {self.date} ({self.get_type_display()})"

    def get_end_datetime(self):
        """Build an aware datetime for this event's end time in current timezone."""
        naive_end = datetime.combine(self.date, self.end_time)
        return timezone.make_aware(naive_end, timezone.get_current_timezone())

    def sync_status_with_time(self, now=None, save=True):
        """
        Promote pending events to missed when they are already in the past.
        Returns True when a transition was applied.
        """
        if self.status != self.Status.PENDING:
            return False

        current_time = now or timezone.localtime()
        if self.get_end_datetime() >= current_time:
            return False

        self.status = self.Status.MISSED
        if save and self.pk:
            self.save(update_fields=["status", "updated_at"])
        return True

    @classmethod
    def mark_pending_as_missed(cls, queryset):
        """
        Bulk transition only the current queryset slice.
        Keeps update cost bounded to events currently being accessed.
        """
        now_local = timezone.localtime()
        current_time = now_local.time().replace(microsecond=0, tzinfo=None)
        return queryset.filter(status=cls.Status.PENDING).filter(
            Q(date__lt=now_local.date())
            | Q(date=now_local.date(), end_time__lt=current_time)
        ).update(status=cls.Status.MISSED, updated_at=timezone.now())
