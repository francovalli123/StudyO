from django.db import models
from django.conf import settings
from datetime import timedelta, date
from apps.subject.models import *
from django.utils import timezone

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

    # Propiedad para saber si se completó hoy
    @property
    def is_completed_today(self):
        # localdate() usa la hora configurada en tu settings.py (TIME_ZONE)
        today = timezone.localdate() 
        return self.records.filter(date=today, completed=True).exists()

    # Lógica de Racha que se resetea a 0 si fallas
    def calculate_streak(self):
        # Obtenemos solo registros completados, ordenados del más nuevo al más viejo
        records = self.records.filter(completed=True).order_by('-date')
        
        if not records.exists():
            return 0

        today = timezone.localdate()
        last_record_date = records[0].date
        streak = 0
        
        # LÓGICA DE CORTE (RESET A CERO)
        # Calculamos la diferencia en días entre hoy y el último registro
        delta_days = (today - last_record_date).days

        if self.frequency == self.DAILY:
            # Si es diario:
            # delta 0 = Lo hice hoy (Racha sigue)
            # delta 1 = Lo hice ayer (Racha sigue, pendiente hoy)
            # delta > 1 = No lo hice ayer (Racha ROTA -> 0)
            if delta_days > 1:
                return 0
                
            # Definimos desde qué fecha empezamos a contar hacia atrás
            check_date = last_record_date 

        elif self.frequency == self.WEEKLY:
            # Si es semanal (lógica simple de semanas naturales o ventana de 7 días):
            # Aquí asumimos que si pasaron más de 7 días desde el último, se rompe.
            if delta_days > 7: # Puedes ajustar este margen según tu regla de negocio
                return 0
            check_date = last_record_date

        # BUCLE DE CONTEO
        for record in records:
            # Si la fecha coincide con la esperada, sumamos
            if record.date == check_date:
                streak += 1
                
                # Preparamos la siguiente fecha esperada hacia el pasado
                if self.frequency == self.DAILY:
                    check_date -= timedelta(days=1)
                elif self.frequency == self.WEEKLY:
                    # Si hay varios registros en la misma semana, debemos tener cuidado.
                    # Para simplificar, buscamos consistencia semanal:
                    # Esta lógica asume 1 por semana estricto. 
                    # Si permites flexibilidad, la lógica cambia un poco.
                    check_date -= timedelta(weeks=1)
            
            # Si encontramos un registro MÁS VIEJO que la fecha esperada, hay un hueco
            elif record.date < check_date:
                break 
                # Ejemplo: Esperaba el 20/10, encontré el 18/10. Faltó el 19. Fin.
            
            # Si record.date > check_date (duplicados del mismo día), los ignoramos y seguimos
            
        return streak