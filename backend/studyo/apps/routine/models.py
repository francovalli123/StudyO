from django.db import models
from django.conf import settings

# La rutina pertenece a un usuario, contiene múltiples bloques rutinarios 
# Este modelo representa una rutina semanal de estudio, con bloques de tiempo asignados a materias
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
        return f"{self.name}"


class WeeklyObjective(models.Model):
    """Objetivos estratégicos semanales del usuario.
    Se usan en el dashboard para listar, crear, editar y borrar objetivos clave.
    
    ARCHIVADO (no borrado):
    - is_active: Indica si el objetivo está activo o archivado
    - archived_at: Timestamp de archivado (None si está activo)
    
    El dashboard solo muestra objetivos con is_active=True.
    Al final de cada semana, se archivan (is_active=False, archived_at=now).
    """
    PRIORITY_CHOICES = [
        (1, 'Alta'),
        (2, 'Media'),
        (3, 'Baja'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_objectives'
    )
    subject = models.ForeignKey(
        'subject.Subject',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='weekly_objectives'
    )
    title = models.CharField(max_length=150)
    detail = models.TextField(blank=True)
    priority = models.IntegerField(choices=PRIORITY_CHOICES, null=True, blank=True)
    notes = models.TextField(blank=True)
    is_completed = models.BooleanField(default=False)
    area = models.CharField(max_length=100, default='General', blank=True)  # Nombre del área/materia
    icon = models.CharField(max_length=10, default='⚡', blank=True)  # Emoji o icono
    
    # Archivado soft-delete: no se borra, se marca como inactivo
    is_active = models.BooleanField(default=True, help_text="False cuando se archiva al final de la semana")
    archived_at = models.DateTimeField(null=True, blank=True, help_text="Timestamp de archivado")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title}"


class WeeklyObjectiveHistory(models.Model):
    """Historial de objetivos semanales para estadísticas.
    Se guarda cuando un objetivo semanal es eliminado al final de la semana.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='weekly_objective_history'
    )
    title = models.CharField(max_length=150)
    area = models.CharField(max_length=100, default='General', blank=True)
    priority = models.IntegerField(choices=WeeklyObjective.PRIORITY_CHOICES, null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    week_start_date = models.DateField()  # Fecha de inicio de la semana (lunes)
    week_end_date = models.DateField()    # Fecha de fin de la semana (domingo)
    created_at = models.DateTimeField()   # Fecha de creación del objetivo
    completed_at = models.DateTimeField(null=True, blank=True)  # Fecha de completación si aplica

    def __str__(self):
        return f"{self.title} - {self.week_start_date} to {self.week_end_date}"
