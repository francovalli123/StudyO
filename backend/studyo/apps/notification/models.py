from django.db import models
from django.conf import settings
from apps.routineBlock.models import RoutineBlock

# Modelo Notificación. Gestiona los recordatorios de estudios programados para el usuario.
class Notification(models.Model):
    # Atributos 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, # Esto hace que si se borra el usuario, se borren todos los habitos del mismo
        related_name='notifications' # Acceso inverso: user.notifications.all()
    )

    routine_block = models.ForeignKey(RoutineBlock, on_delete=models.SET_NULL, null=True, blank=True, related_name='notifications') # Opcional, para vincular a un bloque de estudio específico
    message = models.CharField(max_length=200) # Mensaje del recordatorio, por ejemplo, estudiar matematicas a las 21:00
    scheduled_time = models.DateTimeField() # Fecha y hora programada (esto es obligatorio)
    sent = models.BooleanField(default=False) # Estado de envio (booleano: true/false)
    created_at = models.DateTimeField(auto_now_add=True) # Fecha de creación

    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})" # Esto sirve para debuggear
