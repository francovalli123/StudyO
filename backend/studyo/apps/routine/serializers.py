from rest_framework import serializers
from .models import Routine
from apps.routineBlock.serializers import RoutineBlockSerializer
from apps.routineBlock.models import RoutineBlock

# El serializer define cómo se convierte la rutina en JSON (y viceversa), y qué campos mostrar
class RoutineSerializer(serializers.ModelSerializer):
    blocks = RoutineBlockSerializer(many=True, required=False)
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Routine
        fields = ['id', 'user_email', 'name', 'blocks', 'start_date', 'end_date', 'created_at', 'updated_at'] # Solo se muestran estos campos.
        read_only_fields = ['created_at', 'updated_at']

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
        routine = Routine.objects.create(user=user, **validated_data)

        for block_data in blocks_data:
            RoutineBlock.objects.create(routine=routine, **block_data)

        return routine