from rest_framework import serializers
from .models import Routine, WeeklyObjective
from apps.routineBlock.serializers import RoutineBlockSerializer
from apps.routineBlock.models import RoutineBlock

# El serializer define cómo se convierte la rutina en JSON (y viceversa), y qué campos mostrar
class RoutineSerializer(serializers.ModelSerializer):
    blocks = RoutineBlockSerializer(many=True, required=False)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Routine
        fields = ['id', 'user_email', 'name', 'blocks', 'start_date', 'end_date', 'created_at', 'updated_at'] # Solo se muestran estos campos.
        read_only_fields = ['created_at', 'updated_at', 'user']

    def validate(self, data):
            """Validar que end_date sea posterior a start_date si se proporciona."""
            start_date = data.get('start_date')
            end_date = data.get('end_date')

            if end_date and end_date < start_date:
                raise serializers.ValidationError("La fecha de fin debe ser posterior a la fecha de inicio.")

            return data

    def create(self, validated_data):
        """Crear una rutina con bloques anidados."""
        blocks_data = validated_data.pop('blocks', [])
        user = self.context['request'].user

        # Hay que asegurarse que user no esté en validated data
        validated_data.pop('user', None)

        routine = Routine.objects.create(user=user, **validated_data)

        for block_data in blocks_data:
            RoutineBlock.objects.create(routine=routine, **block_data)

        return routine


class WeeklyObjectiveSerializer(serializers.ModelSerializer):
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = WeeklyObjective
        fields = ['id', 'title', 'detail', 'priority', 'notes', 'subject', 'subject_name', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'user']

    def create(self, validated_data):
        # asegurar que el usuario autenticado se asigne
        validated_data.pop('user', None)
        user = self.context['request'].user
        return WeeklyObjective.objects.create(user=user, **validated_data)
