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
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import base64
from django.core.files.base import ContentFile

User = get_user_model()

# Registro de usuarios.
class RegisterView(CreateAPIView):
    queryset = User.objects.all()   # El framework necesita esto para ciertas operaciones internas
    serializer_class = RegisterSerializer   # Le decimos a la vista que serializer usar para convertir los datos de entrada JSON en un objeto Python, y validar esos datos
    permission_classes = [AllowAny]     # Permite que usuarios no autenticados puedan acceder al endpoint (nadie está autenticado antes de registrarse)

# Obtener información del usuario actual
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        user = request.user
        # Handle avatar file upload (multipart/form-data)
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            user.save()
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)

        # Handle base64 avatar in JSON payload (fallback)
        avatar_data = request.data.get('avatar')
        if avatar_data and isinstance(avatar_data, str) and avatar_data.startswith('data:'):
            try:
                header, encoded = avatar_data.split(',', 1)
                file_ext = header.split('/')[1].split(';')[0]
                decoded = base64.b64decode(encoded)
                fname = f"avatar_{user.id}.{file_ext}"
                user.avatar.save(fname, ContentFile(decoded), save=True)
                serializer = UserSerializer(user, context={'request': request})
                return Response(serializer.data)
            except Exception as e:
                return Response({'detail': 'Invalid avatar data'}, status=status.HTTP_400_BAD_REQUEST)

        # Otherwise treat as partial update for allowed fields
        data = {}
        for field in ('first_name', 'last_name', 'email'):
            if field in request.data:
                data[field] = request.data.get(field)

        # Preferences: accept a `preferences` object from frontend and store in notification_preferences
        if 'preferences' in request.data:
            try:
                prefs = request.data.get('preferences') or {}
                # Update language field if present
                lang = prefs.get('language')
                if isinstance(lang, str) and lang:
                    user.language = lang
                # Merge into user.notification_preferences (replace for now)
                user.notification_preferences = prefs
                user.save()
                serializer = UserSerializer(user, context={'request': request})
                return Response(serializer.data)
            except Exception as e:
                return Response({'detail': 'Invalid preferences format.'}, status=status.HTTP_400_BAD_REQUEST)

        # Allow direct language update
        if 'language' in request.data:
            lang = request.data.get('language')
            if isinstance(lang, str) and lang:
                user.language = lang
                user.save()
                serializer = UserSerializer(user, context={'request': request})
                return Response(serializer.data)

        if data:
            # Update fields and save
            for k, v in data.items():
                setattr(user, k, v)
            user.save()
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)

        return Response({'detail': 'No valid data provided.'}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        # For PUT, accept same behavior as PATCH (overwrite where provided)
        return self.patch(request)

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