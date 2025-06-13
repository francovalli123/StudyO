from rest_framework import serializers
from .models import PomodoroSession

# El serializer define cómo se convierte la sesion de Pomodoro en JSON (y viceversa), y qué campos mostrar
class PomodoroSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PomodoroSession
        fields = ['id', 'subject', 'start_time', 'end_time', 'duration', 'notes']
