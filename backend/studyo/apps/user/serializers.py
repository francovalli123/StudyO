from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import get_user_model

# Crea un serializer basado en modelo (User) para convertir datos JSON <-> objetos Python, y aplicar validaciones automáticas

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    country = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "country",
        )

    def validate(self, attrs):
        print("REGISTER VALIDATED DATA:", attrs)
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
class UserSerializer(serializers.ModelSerializer):
    """Serializer para obtener información del usuario (sin contraseña)"""
    avatar = serializers.ImageField(read_only=True)
    preferences = serializers.SerializerMethodField()
    language = serializers.CharField(read_only=True)
    timezone = serializers.CharField(read_only=True)
    country = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "avatar", "preferences", "language", "timezone", "country"]
        read_only_fields = ["id", "username"]

    def get_preferences(self, obj):
        # Return stored notification/preferences JSON under a single key to be compatible with frontend
        try:
            prefs = getattr(obj, 'notification_preferences', {}) or {}
            # Ensure language is present even if not stored in preferences JSON
            if 'language' not in prefs and getattr(obj, 'language', None):
                prefs = {**prefs, 'language': obj.language}
            return prefs
        except Exception:
            return {}