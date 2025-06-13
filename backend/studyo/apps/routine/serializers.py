from rest_framework import serializers
from .models import Routine

# El serializer define cómo se convierte la rutina en JSON (y viceversa), y qué campos mostrar
class RoutineSerializer(serializers.ModelSerializer):
    class Meta:
        model = Routine
        fields = ['id', 'name', 'start_date', 'end_date'] # Solo se muestran estos campos.

