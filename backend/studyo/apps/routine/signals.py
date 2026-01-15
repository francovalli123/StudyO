from django.db.models.signals import post_save
from django.dispatch import Signal
from .models import WeeklyObjective

# Señal custom para cuando se completa una tarea (WeeklyObjective)
task_completed = Signal()

def send_task_completed_signal(sender, instance, created, **kwargs):
    """
    Envía señal custom cuando se completa un WeeklyObjective.
    """
    if instance.is_completed and not created:
        task_completed.send(sender=sender, task=instance)

# Conectar la señal post_save para enviar la señal custom
post_save.connect(send_task_completed_signal, sender=WeeklyObjective)
