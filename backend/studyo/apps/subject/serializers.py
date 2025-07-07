from rest_framework import serializers
from .models import Subject
from apps.habitRecord.models import HabitRecord
from datetime import date

# El serializer define cómo se convierte la materia en JSON (y viceversa), y qué campos mostrar
class SubjectSerializer(serializers.ModelSerializer):
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Subject
        fields = ['id', 'name', 'professor_name', 'priority', 'color', 'created_at', 'updated_at', 'user', 'next_exam_date', 'progress']

    def get_progress(self, obj):
        habits = obj.habits.all()
        total_habits = habits.count()
        if total_habits == 0:
            return 0

        today = date.today()
        completed_count = 0

        for habit in habits:
            # Verificamos si ese hábito se cumplió hoy
            if habit.records.filter(date=today, completed=True).exists():
                completed_count += 1

        return int((completed_count / total_habits) * 100)