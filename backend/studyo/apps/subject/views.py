from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import SubjectSerializer
from .models import Subject
from django.db.models import Sum, Q
from django.utils import timezone
from datetime import timedelta

# Boceto para view de materia

# Crear y listar materias
class SubjectListCreateView(ListCreateAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]  # Un usuario no puede crear una materia sin estar autenticado
 
    def get_queryset(self):
        # Devuelve solo las materias del usuario autenticado
        # Anotamos los minutos de estudio de la última semana (7 días incluyendo hoy)
        start_date = (timezone.now() - timedelta(days=6)).date()
        return Subject.objects.filter(user=self.request.user).annotate(
            study_minutes_week=Sum('pomodoro_sessions__duration', filter=Q(pomodoro_sessions__start_time__date__gte=start_date))
        )
    
    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user=self.request.user)

# Detalles, edición y eliminación de un hábito
class SubjectDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        start_date = (timezone.now() - timedelta(days=6)).date()
        return Subject.objects.filter(user=self.request.user).annotate(
            study_minutes_week=Sum('pomodoro_sessions__duration', filter=Q(pomodoro_sessions__start_time__date__gte=start_date))
        )