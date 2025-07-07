from rest_framework import serializers
from .models import Habit

# El serializer define cómo se convierte el hábito en JSON (y viceversa), y qué campos mostrar
class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Habit
        fields = ['id', 'name', 'frequency', 'streak', 'subject']
