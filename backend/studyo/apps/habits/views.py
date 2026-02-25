from django.db.models import Exists, OuterRef
from django.utils import timezone
from rest_framework.generics import ListCreateAPIView, RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated

from apps.habitRecord.models import HabitRecord
from utils.datetime import get_user_local_date

from .models import Habit
from .serializers import HabitSerializer


def sync_user_habit_streaks(user):
    """
    Keep persisted streak values fresh even when the user has not interacted today.
    """
    habits = Habit.objects.filter(user=user).only("id", "streak", "frequency", "user_id")
    for habit in habits:
        computed_streak = habit.calculate_streak()
        if computed_streak != habit.streak:
            habit.streak = computed_streak
            habit.save(update_fields=["streak", "updated_at"])


class HabitListCreateView(ListCreateAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sync_user_habit_streaks(self.request.user)

        today = get_user_local_date(self.request.user, timezone.now())
        completed_today_qs = HabitRecord.objects.filter(
            habit_id=OuterRef("pk"),
            date=today,
            completed=True,
        )
        return (
            Habit.objects.filter(user=self.request.user)
            .annotate(completed_today=Exists(completed_today_qs))
            .only("id", "name", "frequency", "subject_id", "streak", "is_key", "created_at", "user_id")
        )

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class HabitDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = HabitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        sync_user_habit_streaks(self.request.user)
        return Habit.objects.filter(user=self.request.user).only(
            "id", "name", "frequency", "subject_id", "streak", "is_key", "created_at", "user_id"
        )
