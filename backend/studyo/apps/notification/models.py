from django.db import models
from django.conf import settings
from apps.routineBlock.models import RoutineBlock
from django.utils import timezone

class Notification(models.Model):
    """
    Modelo para registrar notificaciones enviadas al usuario.
    
    Un Notification representa un evento ocurrido (o fallido), NO una tarea futura.
    La recurrencia es manejada por APScheduler + lógica temporal.
    
    Campos:
    - notification_type: Tipo de notificación (key_habit_reminder, weekly_challenge_reminder, etc.)
    - status: pending, sent, failed
    - sent_at: Timestamp de envío exitoso (nullable, solo cuando status=sent)
    - related_object_id: ID del hábito/objetivo/desafío relacionado (opcional)
    - metadata: JSONField para datos adicionales si es necesario
    """
    
    NOTIFICATION_TYPE_CHOICES = [
        ('key_habit_reminder', 'Recordatorio de Hábito Clave'),
        ('weekly_challenge_reminder', 'Recordatorio de Desafío Semanal'),
        ('weekly_objectives_reminder', 'Recordatorio de Objetivos Semanales'),
        ('weekly_summary', 'Resumen Semanal'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pendiente'),
        ('sent', 'Enviado'),
        ('failed', 'Fallido'),
    ]
    
    # Atributos 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    
    notification_type = models.CharField(
        max_length=50,
        choices=NOTIFICATION_TYPE_CHOICES,
        default='key_habit_reminder',
        help_text="Tipo de notificación enviada"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Estado del envío"
    )
    
    # Timestamp de envío exitoso (solo cuando status=sent)
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Timestamp cuando el email fue enviado exitosamente"
    )
    
    # Objeto relacionado (hábito ID, objetivo ID, etc.)
    related_object_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="ID del objeto relacionado (hábito, objetivo, desafío)"
    )
    
    # Metadata adicional para flexibilidad futura
    metadata = models.JSONField(
        default=dict,
        blank=True,
        help_text="Datos adicionales (subject, duration, etc.)"
    )
    
    # Compatibilidad con lógica anterior (puede removerse si no se usa)
    routine_block = models.ForeignKey(
        RoutineBlock,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications'
    )
    
    message = models.CharField(
        max_length=200,
        blank=True,
        help_text="Mensaje del recordatorio (para compatibilidad)"
    )
    
    scheduled_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha y hora programada (para compatibilidad)"
    )
    
    # Timestamps de auditoría
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'notification_type', 'status']),
            models.Index(fields=['user', 'created_at']),
        ]

    def __str__(self):
        try:
            return f"{self.user.username} - {self.get_notification_type_display()} ({self.status})"
        except Exception:
            return f"Notification {self.pk}"

    def mark_sent(self):
        """Marca la notificación como enviada exitosamente."""
        self.status = 'sent'
        self.sent_at = timezone.now()
        self.save(update_fields=['status', 'sent_at', 'updated_at'])

    def mark_failed(self, error_message=None):
        """Marca la notificación como fallida."""
        self.status = 'failed'
        if error_message:
            self.metadata['error'] = error_message
        self.save(update_fields=['status', 'metadata', 'updated_at'])
