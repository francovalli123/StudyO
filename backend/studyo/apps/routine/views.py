from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import RoutineSerializer
from .models import Routine
from rest_framework.decorators import api_view
from apps.routineBlock.models import RoutineBlock
from rest_framework.response import Response
from rest_framework import status
from datetime import time
from django.utils import timezone
from apps.subject.models import Subject

# Crear rutinas de estudio
class RoutineListCreateView(ListCreateAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Devuelve solo las rutinas del usuario autenticado
        return Routine.objects.filter(user = self.request.user)
    
    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user = self.request.user) 

# Detalles, edición y eliminación de una rutina de estudio
class RoutineDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = RoutineSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Devuelve solo las rutinas del usuario autenticado
        return Routine.objects.filter(user = self.request.user)

    def perform_update(self, serializer):
        # Valida que la rutina se actualice con el usuario autenticado
        serializer.save(user = self.request.user)

# Generar rutina de estudio automáticamente
@api_view(['POST'])
def generate_routine(request):
    """
    Generar una rutina automática basada en materias, carga horaria y prioridades.
    Ejemplo de entrada:
    {
        "name": "Rutina Automática",
        "start_date": "2025-07-14",
        "end_date": "2025-07-20",
        "available_hours_per_day": {
            "0": 4,  # Domingo: 4 horas
            "1": 6,  # Lunes: 6 horas
            ...
        }
    }
    """

    try:
        name = request.data.get('name', 'Rutina Automática')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        available_hours_per_day = request.data.get('available_hours_per_day', {})

        # Validación: se debe dar una fecha de inicio y horas disponibles por dia de la semana.
        if not start_date or not available_hours_per_day:
            return Response (
                {'error': 'Se requiere start_date y available_hours_per_day'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validación: fechas
        if end_date:
            start_date_dt = timezone.datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date_dt = timezone.datetime.strptime(end_date, '%Y-%m-%d').date()
            if end_date_dt < start_date_dt:
                return Response(
                    {"error": "La fecha de fin debe ser posterior a la fecha de inicio."},
                        status=status.HTTP_400_BAD_REQUEST
                        )

        # Obtener materias del usuario
        subjects = Subject.objects.filter(user=request.user)
        
        # Valida que el usuario tenga materias registradas en la aplicación
        if not subjects:
            return Response(
                {"error": "No tienes materias registradas para generar una rutina."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Crear la rutina
        routine = Routine.objects.create(
            user=request.user,
            name=name,
            start_date=start_date_dt,
            end_date=end_date_dt
        )

        # Algoritmo simple para distribuir horas según prioridad
        total_priority = sum(subject.priority for subject in subjects)
        blocks = []
        for day, hours in available_hours_per_day.items():
            day = int(day)
            if hours <= 0:
                continue

            # Distribuir horas proporcionalmente según prioridad
            start_hour = 9  # Comenzar a las 9:00 AM
            for subject in subjects:
                # Calcular horas asignadas a esta materia según su prioridad
                subject_hours = (subject.priority / total_priority) * hours
                subject_hours = max(1, round(subject_hours))  # Mínimo 1 hora

                for _ in range(subject_hours):
                    if start_hour >= 22:  # No programar después de las 10 PM
                        break
                    start_time = time(hour=start_hour, minute=0)
                    end_time = time(hour=start_hour + 1, minute=0)
                    blocks.append(
                        RoutineBlock(
                            routine=routine,
                            subject=subject,
                            day_of_week=day,
                            start_time=start_time,
                            end_time=end_time,
                            description=f"Estudiar {subject.name}"
                        )
                    )
                    start_hour += 1

        # Guardar bloques
        RoutineBlock.objects.bulk_create(blocks)

        # Serializar y devolver la rutina generada
        serializer = RoutineSerializer(routine, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({"error": "Error al generar la rutina."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
