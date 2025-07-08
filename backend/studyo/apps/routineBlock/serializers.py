from rest_framework import serializers
from .models import RoutineBlock
from apps.subject.models import Subject
from apps.routine.models import Routine

class RoutineBlockSerializer(serializers.ModelSerializer):
    subject_id = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(), source='subject', required=False, allow_null=True
    )

    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = RoutineBlock
        fields = ['id', 'subject_id', 'day_of_week', 'start_time', 'end_time', 'description']
        extra_kwargs = {
            'start_time': {'format': '%H:%M'},
            'end_time': {'format': '%H:%M'},
        }

    def validate(self, data):
        """Validar que end_time sea posterior a start_time y evitar solapamientos."""
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError("La hora de fin debe ser posterior a la hora de inicio.")

        routine = data.get('routine')
        day_of_week = data.get('day_of_week')
        if routine and day_of_week is not None:
            existing_blocks = RoutineBlock.objects.filter(
                routine=routine, day_of_week=day_of_week
            ).exclude(id=self.instance.pk if self.instance else None)

            for block in existing_blocks:
                if not (end_time <= block.start_time or start_time >= block.end_time):
                    raise serializers.ValidationError("Este bloque se solapa con otro en el mismo día.")

        return data