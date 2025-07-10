from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import PomodoroSessionSerializer
from .models import PomodoroSession

# Vista para la sesión de pomodoro. Permite crear y listar las sesiones del usuario.
class PomodoroSessionCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]  # Solo puede realizar esto si está autenticado
    serializer_class = PomodoroSessionSerializer

    def get_queryset(self):
        # Devuelve las sesiones registradas que tenga el usuario
        return PomodoroSession.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user) # Guarda la sesión

# Detalles, edición y eliminación de una sesión de pomodoro
class PomodoroSessionDetailView(RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = PomodoroSessionSerializer

    def get_queryset(self):
        # Devuelve las sesiones registradas que tenga el usuario
        return PomodoroSession.objects.filter(user = self.request.user)
    