from django.db import models
from apps.routine.models import Routine
from apps.subject.models import Subject

# Representa un bloque de tiempo específico dentro de una rutina, asignado a una materia o tarea de estudio
class RoutineBlock(models.Model):

    # Atributos
    routine = models.ForeignKey(Routine, on_delete=models.CASCADE, related_name='blocks')   # Clave foránea al modelo Rutina
    subject = models.ForeignKey(Subject, on_delete=models.SET_NULL, null=True, blank=True, related_name='blocks')   # Clave foránea al modelo Materia  

    day_of_week = models.IntegerField()  # Día de la semana, obligatorio. 0=Domingo, 1=Lunes, 2=Martes, etc
    start_time = models.TimeField() # Hora de inicio obligatoria. Ejemplo: 09:00 
    end_time = models.TimeField()   # Hora de fin obligatoria. Ejemplo: 10:30   
    description = models.CharField(max_length=200, blank=True)  # Descripción del bloque, opcional. Ejemplo: Repasar teoría.

    def __str__(self):
        return f"{self.name} ({self.get_frequency_display()})" # Esto sirve para debuggear
