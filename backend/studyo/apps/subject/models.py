from django.db import models
from django.conf import settings

# Queremos que cada meteria tenga un nombre, pueda estar vinculada a un usuario, tenga prioridad (alta, media, baja)
# Tambien que tenga campos automáticos como fecha de creación y modificación
# Y pueda tener una descripción opcional

class Subject (models.Model):
    # Defino las constantes para las prioridades
    HIGH = 1
    MEDIUM = 2
    LOW = 3

    PRIORITY_CHOICES = [(HIGH, 'Alta'), (MEDIUM, 'Media'), (LOW, 'Baja')] # Opciones de prioridad para cada materia

    #Atributos 
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Esto referencia al usuario borrado
        on_delete=models.CASCADE, # Si se borra el usuario, se borran sus materias
        related_name='subjects' # Acesso inverso: user.subjects.all()
    )
    name = models.CharField(max_length=100) # Nombre obligatorio. Máxima cantidad de carácteres: 100.
    professor_name = models.TextField(blank=True, null=True) # Nombre del profesor de la materia
    priority = models.IntegerField(choices=PRIORITY_CHOICES, blank=True, null=True) # Prioridad opcional pero las opciones definidas
    color = models.CharField(max_length=20, blank=True, null=True) # Color opcional de la materia para el frontend
    created_at = models.DateTimeField(auto_now_add=True)  # Se setea al crear
    updated_at = models.DateTimeField(auto_now=True)      # Se actualiza cada vez que se guarda
    next_exam_date = models.DateField(blank=True, null=True)    # Próxima fecha de examen
    progress = models.PositiveIntegerField(default=0)  # Progreso de la materia, de 0 a 100
    weekly_target_minutes = models.PositiveIntegerField(default=300, help_text = "Objetivo semanal medido en minutos. ") # Objetivo de minutos semanales, 5 hs por defecto

    def __str__(self):
        return self.name
