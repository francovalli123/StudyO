from rest_framework import serializers
from .models import Habit
# serializers.py
class HabitSerializer(serializers.ModelSerializer):
    streak = serializers.IntegerField(source='calculate_streak', read_only=True)
    # Este campo es CRUCIAL:
    completed_today = serializers.BooleanField(source='is_completed_today', read_only=True)

    class Meta:
        model = Habit
        fields = ['id', 'name', 'frequency', 'subject', 'streak', 'completed_today', 'is_key', 'created_at']