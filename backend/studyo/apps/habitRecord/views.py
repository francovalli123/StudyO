from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from datetime import date
from .models import Habit, HabitRecord
from .serializers import HabitRecordSerializer

class CompleteHabitView(APIView):
    permission_classes = [IsAuthenticated]

    # Marcar un habito como completado
    def post(self, request, habit_id):
        try:
            habit = Habit.objects.get(id=habit_id, user=request.user)
        except Habit.DoesNotExist:
            return Response({'error': 'Hábito no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

        today = date.today()

        if HabitRecord.objects.filter(habit=habit, date=today).exists():
            return Response({'detail': 'Ya marcaste este hábito como completado hoy.'}, status=status.HTTP_200_OK)

        record = HabitRecord.objects.create(
            habit=habit,
            date=today,
            completed=True
        )

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

        today = date.today()

        try:
            record = HabitRecord.objects.get(habit=habit, date=today)
            record.delete()
        except HabitRecord.DoesNotExist:
            return Response({'detail': 'Este hábito no fue marcado como completado hoy.'}, status=status.HTTP_200_OK)

        return Response({'detail': 'Hábito desmarcado como completado.', 'streak': habit.streak}, status=status.HTTP_200_OK)
