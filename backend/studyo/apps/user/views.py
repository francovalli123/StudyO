from django.shortcuts import render
from .serializers import *
from .models import *
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny
from .serializers import RegisterSerializer
from django.contrib.auth.models import User

# Registro de usuarios.
class RegisterView(CreateAPIView):
    queryset = User.objects.all()   # El framework necesita esto para ciertas operaciones internas
    serializer_class = RegisterSerializer   # Le decimos a la vista que serializer usar para convertir los datos de entrada JSON en un objeto Python, y validar esos datos
    permission_classes = [AllowAny]     # Permite que usuarios no autenticados puedan acceder al endpoint (nadie está autenticado antes de registrarse)

