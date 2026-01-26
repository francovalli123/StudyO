from datetime import timedelta, time

from django.utils import timezone
from django.db import transaction

from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status

from .models import (
    Routine,
    WeeklyObjective,
    WeeklyObjectiveHistory,
)

from django.shortcuts import render
from .serializers import RoutineSerializer, WeeklyObjectiveSerializer
from rest_framework.decorators import api_view
from apps.routineBlock.models import RoutineBlock
from datetime import time
from django.utils import timezone
from apps.subject.models import Subject

from .serializers import (
    RoutineSerializer,
    WeeklyObjectiveSerializer,
)

from .utils.time import get_user_week_range


# ============================================================
# ROUTINES
# ============================================================

class RoutineListCreateView(ListCreateAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Routine.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class RoutineDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Routine.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================
# GENERATE AUTOMATIC ROUTINE
# ============================================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def generate_routine(request):
    """
    Genera una rutina automática basada en prioridades de materias
    y horas disponibles por día.
    """

    try:
        name = request.data.get("name", "Rutina Automática")
        start_date_str = request.data.get("start_date")
        end_date_str = request.data.get("end_date")
        available_hours_per_day = request.data.get("available_hours_per_day", {})

        if not start_date_str or not available_hours_per_day:
            return Response(
                {"error": "start_date y available_hours_per_day son obligatorios"},
                status=status.HTTP_400_BAD_REQUEST
            )

        start_date = timezone.datetime.strptime(start_date_str, "%Y-%m-%d").date()
        end_date = (
            timezone.datetime.strptime(end_date_str, "%Y-%m-%d").date()
            if end_date_str else None
        )

        if end_date and end_date < start_date:
            return Response(
                {"error": "La fecha de fin debe ser posterior a la fecha de inicio"},
                status=status.HTTP_400_BAD_REQUEST
            )

        subjects = Subject.objects.filter(user=request.user)

        if not subjects.exists():
            return Response(
                {"error": "No tienes materias registradas"},
                status=status.HTTP_400_BAD_REQUEST
            )

        total_priority = sum(subject.priority for subject in subjects)
        if total_priority <= 0:
            return Response(
                {"error": "Las materias deben tener prioridad mayor a 0"},
                status=status.HTTP_400_BAD_REQUEST
            )

        routine = Routine.objects.create(
            user=request.user,
            name=name,
            start_date=start_date,
            end_date=end_date
        )

        blocks = []

        for day_str, hours in available_hours_per_day.items():
            try:
                day = int(day_str)
                hours = int(hours)
            except ValueError:
                continue

            if hours <= 0 or not 0 <= day <= 6:
                continue

            start_hour = 9  # 09:00 AM

            for subject in subjects:
                allocated = max(
                    1,
                    round((subject.priority / total_priority) * hours)
                )

                for _ in range(allocated):
                    if start_hour >= 22:
                        break

                    blocks.append(
                        RoutineBlock(
                            routine=routine,
                            subject=subject,
                            day_of_week=day,
                            start_time=time(hour=start_hour),
                            end_time=time(hour=start_hour + 1),
                            description=f"Estudiar {subject.name}"
                        )
                    )
                    start_hour += 1

        RoutineBlock.objects.bulk_create(blocks)

        serializer = RoutineSerializer(routine, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            {"error": "Error al generar la rutina"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


# ============================================================
# WEEKLY OBJECTIVES
# ============================================================

class WeeklyObjectiveListCreateView(ListCreateAPIView):
    serializer_class = WeeklyObjectiveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeeklyObjective.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class WeeklyObjectiveDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = WeeklyObjectiveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeeklyObjective.objects.filter(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)


# ============================================================
# WEEKLY OBJECTIVES STATS (TIMEZONE SAFE)
# ============================================================
@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_objectives_stats(request):
    """
    Estadísticas semanales basadas en la timezone del usuario.
    Incluye: total/completados, completion rate, promedio diario y top objetivos pendientes.
    """

    user = request.user

    # Obtener rango de la semana actual del usuario
    week_range = get_user_week_range(user)
    current_week_start = week_range["week_start_utc"]
    current_week_end = week_range["week_end_utc"]


    # Objetivos actuales y del historial
    current_objectives = WeeklyObjective.objects.filter(
        user=user,
        created_at__gte=current_week_start,
        created_at__lte=current_week_end,
    )
    history = WeeklyObjectiveHistory.objects.filter(user=user)

    total_objectives = history.count() + current_objectives.count()
    completed_objectives = (
        history.filter(is_completed=True).count()
        + current_objectives.filter(is_completed=True).count()
    )
    completion_rate = (completed_objectives / total_objectives) * 100 if total_objectives else 0

    # Weekly stats por semana
    weekly_stats = {}

    # Función para obtener semana de un datetime
    def get_week_range_from_datetime(dt):
        start = dt - timedelta(days=dt.weekday())  # lunes
        end = start + timedelta(days=6)           # domingo
        return start.date(), end.date()

    # Procesar historial
    for obj in history:
        week_start = obj.week_start_date
        week_end = obj.week_end_date
        week_key = week_start.isoformat()

        weekly_stats.setdefault(week_key, {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "total": 0,
            "completed": 0,
            "completion_rate": 0,
            "average_per_day": 0,
            "pending_objectives": [],
        })

        weekly_stats[week_key]["total"] += 1
        if obj.is_completed:
            weekly_stats[week_key]["completed"] += 1
        else:
            weekly_stats[week_key]["pending_objectives"].append(obj.title or "Sin título")

    # Procesar objetivos actuales
    for obj in current_objectives:
        week_start, week_end = get_week_range_from_datetime(obj.created_at)
        week_key = week_start.isoformat()

        weekly_stats.setdefault(week_key, {
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "total": 0,
            "completed": 0,
            "completion_rate": 0,
            "average_per_day": 0,
            "pending_objectives": [],
        })

        weekly_stats[week_key]["total"] += 1
        if obj.is_completed:
            weekly_stats[week_key]["completed"] += 1
        else:
            weekly_stats[week_key]["pending_objectives"].append(obj.title or "Sin título")

    # Calcular completion rate y promedio diario
    for week in weekly_stats.values():
        if week["total"] > 0:
            week["completion_rate"] = round((week["completed"] / week["total"]) * 100, 1)
            week["average_per_day"] = round(week["total"] / 7, 2)
        else:
            week["completion_rate"] = 0
            week["average_per_day"] = 0

    # Ordenar semanas recientes (máx 12)
    recent_weeks = sorted(weekly_stats.values(), key=lambda x: x["week_start"], reverse=True)[:12]

    return Response({
        "total_objectives": total_objectives,
        "completed_objectives": completed_objectives,
        "completion_rate": round(completion_rate, 1),
        "weekly_stats": recent_weeks,
    })