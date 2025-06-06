from django.db import models
from django.conf import settings

class Habit(models.Model):
    # Defino las constantes para la frecuencia
    DAILY = 1
    WEEKLY = 2

    FREQUENCY_CHOICES = [(DAILY, 'Diario'), (WEEKLY, 'Semanal')] # Frecuencias: Diario y Semanal
    
    # Atributos 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE, # Esto hace que si se borra el usuario, se borren todos los habitos del mismo
        related_name='habits' # Acceso inverso: user.habits.all()
    )

    name = models.CharField(max_length=100) # Nombre obligatorio
    frequency = models.IntegerField(choices=FREQUENCY_CHOICES, default=DAILY) # Frecuencia obligatoria, valor por defecto 'Diario'
    created_at = models.DateTimeField(auto_now_add=True) # Se setea al crear el habito
    updated_at = models.DateTimeField(auto_now=True) # Se setea al actualizar el habito
    streak = models.PositiveIntegerField(default=0) #Racha, se setea en 0 por defecto
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})" # Esto sirve para debuggear
