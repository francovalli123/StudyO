from rest_framework import serializers
from .models import Event

class EventSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'date', 'type', 'type_display', 'start_time', 'end_time', 
                  'subject', 'notes', 'created_at', 'updated_at']

