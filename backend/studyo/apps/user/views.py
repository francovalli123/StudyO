from django.shortcuts import render
from .serializers import *
from .models import *
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import base64
from django.core.files.base import ContentFile
from apps.pomodoroSession.models import PomodoroSession

User = get_user_model()

# ============================
# Registro de usuarios
# ============================
class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request, *args, **kwargs):
        print("HEADERS:", request.headers)
        print("CONTENT TYPE:", request.content_type)
        print("RAW BODY:", request.body)
        print("REQUEST.DATA:", request.data)
        return super().post(request, *args, **kwargs)

# ============================
# Usuario actual
# ============================
class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        serializer = UserSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        user = request.user

        # ----------------------------
        # Avatar (multipart)
        # ----------------------------
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
            user.save()
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)

        # ----------------------------
        # Avatar (base64 en JSON)
        # ----------------------------
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
            except Exception:
                return Response(
                    {'detail': 'Invalid avatar data'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        fields_updated = False

        # ----------------------------
        # Campos básicos
        # ----------------------------
        for field in ('first_name', 'last_name', 'email'):
            if field in request.data:
                setattr(user, field, request.data.get(field))
                fields_updated = True

        # ----------------------------
        # Country (CLAVE para timezone)
        # ----------------------------
        if 'country' in request.data:
            country = request.data.get('country')
            if isinstance(country, str) and country:
                user.country = country
                fields_updated = True

        # ----------------------------
        # Preferences
        # ----------------------------
        if 'preferences' in request.data:
            try:
                prefs = request.data.get('preferences') or {}

                # Language dentro de preferences
                lang = prefs.get('language')
                if isinstance(lang, str) and lang:
                    user.language = lang

                user.notification_preferences = prefs
                fields_updated = True
            except Exception:
                return Response(
                    {'detail': 'Invalid preferences format.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # ----------------------------
        # Onboarding (persisted + hardened transitions)
        # ----------------------------
        if 'onboarding_step' in request.data or 'onboarding_completed' in request.data:
            current_step = user.onboarding_step or User.OnboardingStep.CREATE_SUBJECT
            transition_order = [
                User.OnboardingStep.CREATE_SUBJECT,
                User.OnboardingStep.CREATE_HABIT,
                User.OnboardingStep.CONFIG_POMODORO,
                User.OnboardingStep.START_SESSION,
                User.OnboardingStep.DONE,
            ]
            terminal_steps = {User.OnboardingStep.DONE, User.OnboardingStep.SKIPPED}

            requested_step = request.data.get('onboarding_step', current_step)
            if requested_step not in {choice[0] for choice in User.OnboardingStep.choices}:
                return Response({'detail': 'Invalid onboarding_step.'}, status=status.HTTP_400_BAD_REQUEST)

            # Product decision: once terminal (DONE/SKIPPED), onboarding never reactivates.
            if current_step in terminal_steps and requested_step != current_step:
                return Response({'detail': 'Onboarding already finalized.'}, status=status.HTTP_400_BAD_REQUEST)

            if requested_step == User.OnboardingStep.SKIPPED and current_step not in terminal_steps:
                user.onboarding_step = User.OnboardingStep.SKIPPED
                fields_updated = True
            elif requested_step != current_step:
                if requested_step == User.OnboardingStep.DONE:
                    return Response({'detail': 'Direct transition to DONE is not allowed.'}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    current_index = transition_order.index(current_step)
                    requested_index = transition_order.index(requested_step)
                except ValueError:
                    return Response({'detail': 'Invalid onboarding transition.'}, status=status.HTTP_400_BAD_REQUEST)

                if requested_index != current_index + 1:
                    return Response({'detail': 'Invalid onboarding step transition.'}, status=status.HTTP_400_BAD_REQUEST)

                user.onboarding_step = requested_step
                fields_updated = True

            if 'onboarding_completed' in request.data:
                completed = request.data.get('onboarding_completed')
                if isinstance(completed, str):
                    completed_value = completed.strip().lower() in ('1', 'true', 'yes', 'on')
                else:
                    completed_value = bool(completed)

                if completed_value is False and user.onboarding_completed:
                    return Response({'detail': 'onboarding_completed cannot be reverted.'}, status=status.HTTP_400_BAD_REQUEST)

                if completed_value:
                    valid_pomodoro_exists = PomodoroSession.objects.filter(
                        user=user,
                        subject__isnull=False,
                        duration__gt=0,
                    ).exists()
                    if not valid_pomodoro_exists:
                        return Response(
                            {'detail': 'Complete at least one valid pomodoro session before finishing onboarding.'},
                            status=status.HTTP_400_BAD_REQUEST,
                        )
                    user.onboarding_completed = True
                    user.onboarding_step = User.OnboardingStep.DONE
                    fields_updated = True

        # ----------------------------
        # Language directa
        # ----------------------------
        if 'language' in request.data:
            lang = request.data.get('language')
            if isinstance(lang, str) and lang:
                user.language = lang
                fields_updated = True

        # ----------------------------
        # Guardado final (1 solo save)
        # ----------------------------
        if fields_updated:
            user.save()  # acá se recalcula timezone si el modelo lo hace
            serializer = UserSerializer(user, context={'request': request})
            return Response(serializer.data)

        return Response(
            {'detail': 'No valid data provided.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def put(self, request):
        return self.patch(request)


# ============================
# Logout
# ============================
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response({"detail": "Sesión cerrada exitosamente"})


# ============================
# Eliminar cuenta
# ============================
class DeleteAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user = request.user
        user.delete()
        return Response(
            {"detail": "Cuenta eliminada exitosamente."},
            status=status.HTTP_204_NO_CONTENT
        )
