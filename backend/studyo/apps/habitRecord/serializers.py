from rest_framework import serializers
from .models import HabitRecord

# El serializer define cómo se convierte el registro del hábito en JSON (y viceversa), y qué campos mostrar
class HabitRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = HabitRecord
        fields = ['id', 'habit', 'date', 'completed', 'notes']
        read_only_fields = ['date', 'completed'] # El usuario no lo elige, hoy y True
