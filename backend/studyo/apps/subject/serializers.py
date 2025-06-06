from rest_framework import serializers
from .models import Subject

# El serializer define cómo se convierte la materia en JSON (y viceversa), y qué campos mostrar
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'description', 'priority', 'color', 'created_at', 'updated_at', 'user']
        read_only_fields = ['id', 'created_at', 'updated_at', 'user']
