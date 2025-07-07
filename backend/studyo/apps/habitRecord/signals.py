from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import HabitRecord

@receiver(post_save, sender=HabitRecord)
def update_streak_on_save(sender, instance, **kwargs):
    habit = instance.habit
    habit.streak = habit.calculate_streak()
    habit.save()

@receiver(post_delete, sender=HabitRecord)
def update_streak_on_delete(sender, instance, **kwargs):
    habit = instance.habit
    habit.streak = habit.calculate_streak()
    habit.save()