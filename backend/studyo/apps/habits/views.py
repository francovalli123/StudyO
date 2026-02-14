from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListCreateAPIView
from .serializers import HabitSerializer
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .models import Habit
from apps.habitRecord.models import HabitRecord
from django.db.models import Exists, OuterRef
from django.utils import timezone
from utils.datetime import get_user_local_date

#Requisitos funcionales
#Visualización de progreso: Proveer datos para el dashboard de progreso (por ejemplo, porcentaje de hábitos completados por semana/mes).

# Crear y listar hábitos
class HabitListCreateView(ListCreateAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]  # Para que el usuario pueda crear o listar habitos, debe estar autenticado

    def get_queryset(self):
        # Devuelve solo los hábitos del usuario autenticado
        today = get_user_local_date(self.request.user, timezone.now())
        completed_today_qs = HabitRecord.objects.filter(
            habit_id=OuterRef("pk"),
            date=today,
            completed=True,
        )
        return (
            Habit.objects
            .filter(user=self.request.user)
            .annotate(completed_today=Exists(completed_today_qs))
            .only("id", "name", "frequency", "subject_id", "streak", "is_key", "created_at", "user_id")
        )

    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user=self.request.user)

# Detalles, edición y eliminación de un hábito
class HabitDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user).only(
            "id", "name", "frequency", "subject_id", "streak", "is_key", "created_at", "user_id"
        )
