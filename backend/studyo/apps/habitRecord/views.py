from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.utils import timezone
from .models import Habit, HabitRecord
from .serializers import HabitRecordSerializer
from apps.weekly_challenges.evaluators import evaluate_weekly_challenge
from django.utils import timezone as dj_timezone

class CompleteHabitView(APIView):
    permission_classes = [IsAuthenticated]

    # Marcar un habito como completado
    def post(self, request, habit_id):
        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response({'error': 'Hábito no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.localdate()

        if HabitRecord.objects.filter(habit=habit, date=today).exists():
            return Response({'detail': 'Ya marcaste este hábito como completado hoy.'}, status=status.HTTP_200_OK)

        record = HabitRecord.objects.create(
            habit=habit,
            date=today,
            completed=True
        )

        # Actualizar la racha
        habit.streak = habit.calculate_streak()
        habit.save()

        # Trigger weekly challenge evaluation (lazy, idempotent)
        try:
            evaluate_weekly_challenge(request.user, dj_timezone.now())
        except Exception:
            # Do not block habit completion on challenge evaluation errors
            pass

        serializer = HabitRecordSerializer(record)

        return Response({
            'detail': 'Hábito marcado como completado.',
            'record': serializer.data,
            'streak': habit.streak  
        }, status=status.HTTP_201_CREATED)

    # Desmarcar un hábito como completado
    def delete(self, request, habit_id):
        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response({'error': 'Hábito no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        today = timezone.localdate()

        try:
            record = HabitRecord.objects.get(habit=habit, date=today)
            record.delete()
        except HabitRecord.DoesNotExist:
            return Response({'detail': 'Este hábito no fue marcado como completado hoy.'}, status=status.HTTP_200_OK)

        # Recalcular la racha después de eliminar el registro
        habit.streak = habit.calculate_streak()
        habit.save()

        # Trigger weekly challenge evaluation after un-completing (safe to ignore errors)
        try:
            evaluate_weekly_challenge(request.user, dj_timezone.now())
        except Exception:
            pass

        return Response({'detail': 'Hábito desmarcado como completado.', 'streak': habit.streak}, status=status.HTTP_200_OK)
