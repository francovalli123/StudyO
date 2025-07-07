from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListCreateAPIView
from .serializers import HabitSerializer
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from .models import Habit

#Requisitos funcionales
#Visualización de progreso: Proveer datos para el dashboard de progreso (por ejemplo, porcentaje de hábitos completados por semana/mes).

# Crear y listar hábitos
class HabitListCreateView(ListCreateAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]  # Para que el usuario pueda crear o listar habitos, debe estar autenticado

    def get_queryset(self):
        # Devuelve solo los hábitos del usuario autenticado
        return Habit.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user=self.request.user)

# Detalles, edición y eliminación de un hábito
class HabitDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Habit.objects.filter(user=self.request.user)
