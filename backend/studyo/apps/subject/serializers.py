from rest_framework import serializers
from .models import Subject
from django.utils import timezone
from datetime import timedelta
from django.db import models

# El serializer define cómo se convierte la materia en JSON (y viceversa), y qué campos mostrar
class SubjectSerializer(serializers.ModelSerializer):
    # `study_minutes_week` se puede anotar desde la view (aggregate Sum de PomodoroSession.duration)
    study_minutes_week = serializers.IntegerField(read_only=True)
    weekly_target_minutes = serializers.IntegerField()
    progress = serializers.IntegerField(read_only=True, source='calculated_progress')
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'professor_name', 'priority', 'color', 'created_at', 'updated_at', 'user', 'next_exam_date', 'study_minutes_week', 'weekly_target_minutes', 'progress']