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
        try:
            return f"{self.user.username}: {self.message} @ {self.scheduled_time}"
        except Exception:
            return f"Notification {self.pk}"

    def send_email(self):
        """Send an email for this notification. Uses Django email settings and an HTML template."""
        from django.template.loader import render_to_string
        from django.core.mail import EmailMultiAlternatives
        from django.conf import settings
        try:
            subject = "Recordatorio de StudyO"
            to_email = self.user.email
            context = {
                'user': self.user,
                'message': self.message,
                'scheduled_time': self.scheduled_time,
                'site_name': getattr(settings, 'SITE_NAME', 'StudyO'),
                'site_url': getattr(settings, 'SITE_URL', '/')
            }
            html_body = render_to_string('notification/email.html', context)
            text_body = f"{self.message}\n\nVisita StudyO para más detalles."

            email = EmailMultiAlternatives(subject, text_body, settings.DEFAULT_FROM_EMAIL, [to_email])
            email.attach_alternative(html_body, "text/html")
            email.send(fail_silently=False)
            # mark sent
            self.sent = True
            self.save(update_fields=['sent'])
            return True
        except Exception:
            return False
