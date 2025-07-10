from rest_framework import serializers
from .models import PomodoroSession

# El serializer define cómo se convierte la sesion de Pomodoro en JSON (y viceversa), y qué campos mostrar
class PomodoroSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = PomodoroSession
        fields = ['id', 'subject', 'subject_name', 'start_time', 'end_time', 'duration', 'notes']
