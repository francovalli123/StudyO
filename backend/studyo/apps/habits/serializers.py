from rest_framework import serializers
from .models import Habit
# serializers.py
class HabitSerializer(serializers.ModelSerializer):
    # Use persisted streak field to avoid expensive per-object streak recalculation on list endpoints.
    streak = serializers.IntegerField(read_only=True)
    completed_today = serializers.SerializerMethodField()

    class Meta:
        model = Habit
        fields = ['id', 'name', 'frequency', 'subject', 'streak', 'completed_today', 'is_key', 'created_at']

    def get_completed_today(self, obj):
        # Prefer queryset annotation to avoid N+1 queries.
        annotated = getattr(obj, 'completed_today', None)
        if annotated is not None:
            return bool(annotated)
        return bool(obj.is_completed_today)
