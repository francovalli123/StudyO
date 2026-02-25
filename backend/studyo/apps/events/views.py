from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Event
from .serializers import EventSerializer


class EventViewSet(viewsets.ModelViewSet):
    """
    CRUD for user events plus domain actions for task-like states.
    """

    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        base_queryset = Event.objects.filter(user=self.request.user)

        # Keep status transitions lightweight: update only the current user's stale pending events.
        Event.mark_pending_as_missed(base_queryset)

        return (
            base_queryset.select_related("subject")
            .only(
                "id",
                "user_id",
                "title",
                "date",
                "type",
                "status",
                "start_time",
                "end_time",
                "subject_id",
                "notes",
                "created_at",
                "updated_at",
                "subject__id",
                "subject__name",
            )
            .order_by("date", "start_time")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["patch"], url_path="complete")
    def complete(self, request, pk=None):
        event = self.get_object()

        # Sync first so stale pending items cannot be completed once they are already expired.
        event.sync_status_with_time()
        if event.status == Event.Status.MISSED:
            return Response(
                {"detail": "Missed events cannot be marked as completed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if event.status != Event.Status.COMPLETED:
            event.status = Event.Status.COMPLETED
            event.save(update_fields=["status", "updated_at"])

        serializer = self.get_serializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)
