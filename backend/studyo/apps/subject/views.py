from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import SubjectSerializer
from .models import Subject
from django.db import models
from django.db.models import Sum, Q, Case, When, IntegerField, Value
from django.db.models.functions import Least, Greatest
from django.utils import timezone
from datetime import timedelta
import pytz

# Boceto para view de materia

# Crear y listar materias
class SubjectListCreateView(ListCreateAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]  # Un usuario no puede crear una materia sin estar autenticado
 
    def get_queryset(self):
        # Devuelve solo las materias del usuario autenticado
        # Anotamos los minutos de estudio de la semana actual (desde el lunes 00:00 en la timezone del usuario)
        user = self.request.user
        try:
            user_tz = pytz.timezone(user.timezone)
        except pytz.exceptions.UnknownTimeZoneError:
            # Fallback to UTC if timezone is invalid
            user_tz = pytz.timezone('UTC')
        now = timezone.now().astimezone(user_tz)
        # Encontrar el lunes de esta semana
        days_since_monday = now.weekday()  # 0 = Monday
        monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        monday_utc = monday.astimezone(pytz.UTC)

        study_minutes_expr = Sum(
            'pomodoro_sessions__duration',
            filter=Q(pomodoro_sessions__start_time__gte=monday_utc)
        )

        # Calcular progreso como porcentaje: (minutos_estudiados / objetivo_semanal) * 100, limitado a 100%
        progress_expr = Case(
            When(weekly_target_minutes__gt=0, 
                 then=Least(
                     Greatest(
                         (study_minutes_expr * 100) / models.F('weekly_target_minutes'),
                         Value(0)
                     ),
                     Value(100)
                 )
            ),
            default=Value(0),
            output_field=IntegerField()
        )
        
        return Subject.objects.filter(user=user).annotate(
            study_minutes_week=study_minutes_expr,
            computed_progress=progress_expr
        )
    
    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user=self.request.user)

# Detalles, edición y eliminación de un hábito
class SubjectDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        try:
            user_tz = pytz.timezone(user.timezone)
        except pytz.exceptions.UnknownTimeZoneError:
            # Fallback to UTC if timezone is invalid
            user_tz = pytz.timezone('UTC')
        now = timezone.now().astimezone(user_tz)
        days_since_monday = now.weekday()
        monday = (now - timedelta(days=days_since_monday)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        monday_utc = monday.astimezone(pytz.UTC)

        return Subject.objects.filter(user=user).annotate(
            study_minutes_week=Sum(
                'pomodoro_sessions__duration',
                filter=Q(pomodoro_sessions__start_time__gte=monday_utc)
            )
        )
