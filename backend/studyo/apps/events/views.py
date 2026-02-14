from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from .serializers import EventSerializer
from .models import Event

class EventListCreateView(ListCreateAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Devuelve solo los eventos del usuario autenticado
        return (
            Event.objects
            .filter(user=self.request.user)
            .select_related("subject")
            .only(
                "id", "user_id", "title", "date", "type", "start_time", "end_time",
                "subject_id", "notes", "created_at", "updated_at",
                "subject__id", "subject__name",
            )
            .order_by("date", "start_time")
        )

    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user=self.request.user)

class EventDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = EventSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Event.objects
            .filter(user=self.request.user)
            .select_related("subject")
            .only(
                "id", "user_id", "title", "date", "type", "start_time", "end_time",
                "subject_id", "notes", "created_at", "updated_at",
                "subject__id", "subject__name",
            )
            .order_by("date", "start_time")
        )
