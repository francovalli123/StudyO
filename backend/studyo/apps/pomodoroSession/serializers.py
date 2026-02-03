from rest_framework import serializers
from django.db import transaction
from .models import PomodoroSession

# El serializer define cómo se convierte la sesion de Pomodoro en JSON (y viceversa), y qué campos mostrar
class PomodoroSessionSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = PomodoroSession
        fields = ['id', 'subject', 'subject_name', 'start_time', 'end_time', 'duration', 'notes']

    def create(self, validated_data, user=None):
        """
        Defensive, idempotent creation: if a session with same user/start/end/duration
        already exists, return it instead of creating a duplicate. Uses
        `get_or_create` inside a transaction to avoid race conditions.

        The view calls `serializer.save(user=self.request.user)` so `user` is
        expected to be passed as kwarg. If not provided, try to obtain it from
        the serializer context.
        """
        if user is None:
            request = self.context.get('request')
            user = getattr(request, 'user', None)

        start_time = validated_data.get('start_time')
        end_time = validated_data.get('end_time')
        duration = validated_data.get('duration')

        defaults = {
            'subject': validated_data.get('subject'),
            'notes': validated_data.get('notes', ''),
        }

        with transaction.atomic():
            obj, created = PomodoroSession.objects.get_or_create(
                user=user,
                start_time=start_time,
                end_time=end_time,
                duration=duration,
                defaults=defaults
            )

        # Attach a flag so callers can know whether this was newly created
        setattr(obj, '_created', created)
        return obj
