from rest_framework import serializers
from .models import Routine

# El serializer define cómo se convierte la rutina en JSON (y viceversa), y qué campos mostrar
class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routine
        fields = ['name', 'start_date', 'end_date'] # Solo se muestran estos campos.

