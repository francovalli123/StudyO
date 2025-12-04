from django.shortcuts import render
from .serializers import *
from .models import *
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

User = get_user_model()

# Registro de usuarios.
class RegisterView(CreateAPIView):
    queryset = User.objects.all()   # El framework necesita esto para ciertas operaciones internas
    serializer_class = RegisterSerializer   # Le decimos a la vista que serializer usar para convertir los datos de entrada JSON en un objeto Python, y validar esos datos
    permission_classes = [AllowAny]     # Permite que usuarios no autenticados puedan acceder al endpoint (nadie está autenticado antes de registrarse)

# Obtener información del usuario actual
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

# Cerrar sesión
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete() # Elimina el token actual
        return Response({"detail": "Sesión cerrada exitosamente"})  # Devuelve la respuesta http
    
# Eliminar cuenta (El usuario elimina su propia cuenta)
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user # Recibe el usuario a borrar
        user.delete()   # Borra el usuario
        return Response({"detail": "Cuenta eliminada exitosamente."}, status=status.HTTP_204_NO_CONTENT)    # Devuelve la respuesta http