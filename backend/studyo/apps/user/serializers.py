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
        fields = ["username", "email", "password"]      #Limita los campos que se aceptan en la creación del usuario a username, email y password.

    def create(self, validated_data):
        user = User.objects.create_user(
            username = validated_data["username"],
            email = validated_data["email"],
            password = validated_data["password"]
        )

        return user
