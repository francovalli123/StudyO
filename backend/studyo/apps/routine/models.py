from django.db import models
from django.conf import settings

# Create your models here.
class Routine(models.Model):
    # Atributos 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, # Esto hace que si se borra el usuario, se borren todos los habitos del mismo
        related_name='routines' # Acceso inverso: user.routines.all()
    )
    name = models.CharField(max_length=100) # Nombre de la rutina
    start_date = models.DateField() # Fecha de inicio obligatoria
    end_date = models.DateField(null=True, blank=True) # Fecha de finalización opcional
    created_at = models.DateTimeField(auto_now_add=True) # Fecha de creación de la instancia de la rutina (no se muestra en el front)
    updated_at = models.DateTimeField(auto_now=True)    # Fecha de actualización de la instancia de la rutina (no se muestra en el front)

    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})" # Esto sirve para debuggear
