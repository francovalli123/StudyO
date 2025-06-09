from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import HabitRecord

@receiver(post_save, sender=HabitRecord)
def update_streak_on_save(sender, instance, **kwargs):
    habit = instance.habit
    habit.streak = habit.calculate_streak()
    habit.save()

# Cada vez que se guarda un HabitRecord, esto:
#   - Busca el hábito relacionado (habit)
#   - Llama a la función calculate_streak() del modelo Habit
#   - Y guarda la nueva racha en el campo streak (el de la racha)