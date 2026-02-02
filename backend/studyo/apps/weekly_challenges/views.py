from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import WeeklyChallenge
from .serializers import WeeklyChallengeSerializer
from .evaluators import create_weekly_challenge_if_needed


class ActiveWeeklyChallengeView(APIView):
    """
    Idempotent GET endpoint for active weekly challenge.
    
    Behavior:
    - Returns the current active challenge for the user
    - If no active challenge exists, creates one for the current week
    - Always returns a challenge (no null responses)
    - Returns only the 6 required DTO fields
    
    Response:
    {
        "title": str,
        "description": str,
        "current_value": float,
        "target_value": float,
        "progress_percentage": float,
        "status": "active" | "completed" | "failed"
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        GET /api/weekly-challenge/active/
        
        Idempotent endpoint that always returns a challenge.
        """
        # Create challenge if needed (idempotent)
        challenge = create_weekly_challenge_if_needed(request.user, timezone.now())

        # Serialize and return the DTO
        serializer = WeeklyChallengeSerializer(challenge)
        return Response(serializer.data)
