from rest_framework import serializers
from .models import RoutineBlock

# El serializer define cómo se convierte el bloque rutinario en JSON (y viceversa), y qué campos mostrar
class RoutineBlockSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoutineBlock
        fields = ['id', 'name', 'start_date', 'end_date'] # Solo se muestran estos campos.