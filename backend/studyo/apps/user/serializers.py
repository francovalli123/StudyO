from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import get_user_model

# Crea un serializer basado en modelo (User) para convertir datos JSON <-> objetos Python, y aplicar validaciones automáticas

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)   # El campo password es obligatorio pero solo se escribe (no se devuelve en respuesta)

    # Nota: write_only = True protege la contraseña de que no se exponga cuando se hace un GET, por ejemplo.

    class Meta:
        model = User    # Define que el modelo asociado al serializer es User
        fields = ["username", "email", "password", "first_name", "last_name"]      #Limita los campos que se aceptan en la creación del usuario a username, email y password.

    def create(self, validated_data):
        user = User.objects.create_user(
            username = validated_data["username"],
            email = validated_data["email"],
            password = validated_data["password"],
            first_name = validated_data["first_name"],
            last_name = validated_data["last_name"] 
        )

        return user

class UserSerializer(serializers.ModelSerializer):
    """Serializer para obtener información del usuario (sin contraseña)"""
    avatar = serializers.ImageField(read_only=True)
    preferences = serializers.SerializerMethodField()
    language = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "avatar", "preferences", "language"]
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