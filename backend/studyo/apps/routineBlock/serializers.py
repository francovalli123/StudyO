from rest_framework import serializers
from .models import RoutineBlock

# El serializer define cómo se convierte el bloque rutinario en JSON (y viceversa), y qué campos mostrar
class HabitSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutineBlock
        fields = ['name', 'start_date', 'end_date'] # Solo se muestran estos campos.