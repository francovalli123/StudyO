from rest_framework import serializers
from .models import WeeklyChallenge


class WeeklyChallengeDTO(serializers.Serializer):
    """
    DTO (Data Transfer Object) for WeeklyChallenge
    Exposes only the minimal data frontend needs for rendering
    
    All business logic (progress calculation) lives in the backend.
    Frontend receives the final computed state, no calculations needed.
    """
    title = serializers.CharField()
    description = serializers.CharField()
    current_value = serializers.IntegerField()
    target_value = serializers.IntegerField()
    progress_percentage = serializers.FloatField()
    status = serializers.ChoiceField(choices=['active', 'completed', 'failed'])


class WeeklyChallengeSerializer(serializers.ModelSerializer):
    """
    Internal serializer - converts model to DTO
    Backend uses this to compute progress and generate DTO
    """
    progress_percentage = serializers.SerializerMethodField()
    current_value = serializers.SerializerMethodField()
    target_value = serializers.SerializerMethodField()
    title = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()

    class Meta:
        model = WeeklyChallenge
        fields = (
            'title',
            'description',
            'current_value',
            'target_value',
            'progress_percentage',
            'status'
        )

    
    def get_progress_percentage(self, obj):
        """Backend: Calculate progress as percentage (0-100)
        
        This is the ONLY source of truth for progress calculation.
        Frontend must never recalculate this.
        """
        progress = len(obj.completed_days) if obj.completed_days else 0
        if obj.target_days == 0:
            return 0
        percentage = (progress / obj.target_days) * 100
        return min(round(percentage, 2), 100)
    
    def get_current_value(self, obj):
        """Backend: Expose current progress as current_value for DTO"""
        return len(obj.completed_days) if obj.completed_days else 0
    
    def get_target_value(self, obj):
        """Backend: Expose target as target_value for DTO"""
        return obj.target_days
    
    def get_title(self, obj):
        """Backend: Generate dynamic title"""
        return f"Racha de Enfoque Élite - {obj.required_pomodoros_per_day} Pomodoros/día"

    def get_description(self, obj):
        """Backend: Generate dynamic description"""
        return f"Completá {obj.required_pomodoros_per_day} Pomodoros diarios por {obj.target_days} días seguidos. ¡Demuestra tu consistencia!"
