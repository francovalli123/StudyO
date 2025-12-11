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
    progress = serializers.SerializerMethodField()
    user = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'professor_name', 'priority', 'color', 'created_at', 'updated_at', 'user', 'next_exam_date', 'study_minutes_week', 'weekly_target_minutes', 'progress']

    def get_progress(self, obj):
        # Si el queryset ya anotó `study_minutes_week`, lo usamos. Si no, calculamos una suma ligera.
        minutes = getattr(obj, 'study_minutes_week', None)
        if minutes is None:
            # cálculo por seguridad: sumar sesiones de la última semana
            from apps.pomodoroSession.models import PomodoroSession
            end = timezone.now()
            start = (end - timedelta(days=6)).date()
            minutes = PomodoroSession.objects.filter(user=obj.user, subject=obj, start_time__date__gte=start).aggregate(total=models.Sum('duration'))['total'] or 0

        target = getattr(obj, 'weekly_target_minutes', 0) or 0
        if target <= 0:
            return 0
        return min(100, round((minutes / target) * 100))