from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import WeeklyChallenge
from .serializers import WeeklyChallengeSerializer


class ActiveWeeklyChallengeView(APIView):
    """
    Idempotent GET endpoint for active weekly challenge
    
    Behavior:
    - Returns the current active challenge for the user
    - If no active challenge exists, creates one for the current week
    - Always returns a challenge (no null responses)
    - Returns only the 6 required fields (DTO pattern)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/weekly-challenge/active/
        
        Returns: {
            "title": str,
            "description": str,
            "current_value": int,
            "target_value": int,
            "progress_percentage": float,
            "status": "active" | "completed" | "failed"
        }
        """
        # Try to get existing active challenge
        challenge = WeeklyChallenge.objects.filter(
            user=request.user,
            status='active'
        ).order_by('-week_start').first()

        # If no active challenge exists, create one for the current week
        if not challenge:
            challenge = self._create_challenge_for_current_week(request.user)

        # Serialize and return the DTO
        serializer = WeeklyChallengeSerializer(challenge)
        return Response(serializer.data)

    def _create_challenge_for_current_week(self, user):
        """
        Create a new challenge for the current week (idempotent)
        
        Args:
            user: The authenticated user
            
        Returns:
            WeeklyChallenge: The created or existing challenge
        """
        # Get current week boundaries (Monday - Sunday)
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=6)  # Sunday

        # Use get_or_create for idempotency
        challenge, created = WeeklyChallenge.objects.get_or_create(
            user=user,
            week_start=week_start,
            defaults={
                'week_end': week_end,
                'target_days': 5,
                'required_pomodoros_per_day': 5,
                'completed_days': [],
                'status': 'active'
            }
        )

        return challenge
