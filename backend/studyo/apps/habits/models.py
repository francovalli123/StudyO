from django.db import models
from django.conf import settings
from datetime import timedelta, date
from apps.subject.models import *

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
    
    
    subject = models.ForeignKey(    # Materia asociada al hábito (opcional)
        Subject,
        on_delete=models.CASCADE,
        related_name='habits',
        null=True,  # No es obligatorio
        blank=True  
    )
    
    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})" # Esto sirve para debuggear

    # Función para calcular la racha
    def calculate_streak(self):
        records = self.records.filter(completed=True).order_by('-date') # Busca todos los registros completados de ese habito, ordenado del mas reciente al mas viejo
        if not records:
            return 0    # Si no hay registros completados, devuelve 0

        streak = 0 
        today = date.today()    # Esto define el día actual

        for i, record in enumerate(records):    # Se recorre uno por uno los registros
            if self.frequency == Habit.DAILY:
                expected_date = today - timedelta(days=i) # Si el hábito es diario, se espera que todos los registros estén en dias consecutivos
            elif self.frequency == Habit.WEEKLY:
                expected_date = today - timedelta(weeks=i) # Si el hábito es semanal, espera que estén en semanas consecutivas, por ejemplo, todos los lunes

            if record.date == expected_date: # Compara la fecha del registro con la fecha esperada
                streak += 1 # Sigue la racha
            else:
                break   # Se corta la racha

        return streak # Cuando termina de contar, devuelve el valor final de la racha