from rest_framework import serializers
from .models import WeeklyChallenge
from .evaluators import get_evaluator_for_type


class WeeklyChallengeDTO(serializers.Serializer):
    """
    DTO (Data Transfer Object) for WeeklyChallenge
    
    Exposes only the minimal data frontend needs for rendering.
    All business logic lives in the backend.
    Frontend receives the final computed state, no calculations needed.
    """
    title = serializers.CharField()
    description = serializers.CharField()
    current_value = serializers.FloatField()
    target_value = serializers.FloatField()
    progress_percentage = serializers.FloatField()
    status = serializers.ChoiceField(choices=['active', 'completed', 'failed'])


class WeeklyChallengeSerializer(serializers.ModelSerializer):
    """
    Internal serializer - converts WeeklyChallenge model to DTO
    
    Backend uses this to:
    - Get metadata from evaluator (title, description)
    - Calculate progress percentage
    - Return DTO to frontend
    """
    progress_percentage = serializers.SerializerMethodField()
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
        """
        Calculate progress as percentage (0-100).
        
        This is the ONLY source of truth for progress.
        Frontend must never recalculate this.
        """
        if obj.target_value == 0:
            return 0.0

        percentage = (obj.current_value / obj.target_value) * 100
        return min(round(percentage, 2), 100.0)

    def get_title(self, obj):
        """Get title from evaluator"""
        evaluator = get_evaluator_for_type(
            obj.challenge_type,
            obj.user,
            obj.week_start,
            obj.week_end
        )
        return evaluator.get_metadata()['title']

    def get_description(self, obj):
        """Get description from evaluator"""
        evaluator = get_evaluator_for_type(
            obj.challenge_type,
            obj.user,
            obj.week_start,
            obj.week_end
        )
        return evaluator.get_metadata()['description']
