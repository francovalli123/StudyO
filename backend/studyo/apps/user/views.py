from django.shortcuts import render
from .serializers import *
from .models import *
from rest_framework.generics import CreateAPIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.mail import send_mail
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import base64
import hashlib
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone
from django.utils.http import urlencode
import logging

User = get_user_model()
logger = logging.getLogger("apps.user.password_reset")

# ============================
# Registro de usuarios
# ============================
class RegisterView(CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request, *args, **kwargs):

        return super().post(request, *args, **kwargs)


# ============================
# Login (Custom Token)
# ============================
class LoginView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"detail": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(request, username=username, password=password)
        if not user:
            return Response({"detail": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        AuthToken.objects.filter(user=user, is_active=True).update(is_active=False, expires_at=timezone.now())
        token = AuthToken.create_for_user(user)

        return Response(
            {
                "token": token.key,
                "expires_at": token.expires_at,
            },
            status=status.HTTP_200_OK,
        )

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
        token = request.auth
        if isinstance(token, AuthToken):
            token.mark_inactive(reason="logout")
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


# ============================
# Password Reset
# ============================
class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        if email:
            user = User.objects.filter(email__iexact=email).first()
            if user:
                PasswordResetToken.objects.filter(user=user, used_at__isnull=True).update(used_at=timezone.now())
                reset_token, raw_token = PasswordResetToken.issue_for_user(user)
                logger.info("Password reset token created for user_id=%s", user.id)
                query = urlencode({"token": raw_token, "email": user.email})
                FRONTEND_URL = getattr(settings, "FRONTEND_URL", "https://study-o.vercel.app")
                reset_link = f"{FRONTEND_URL}/reset-password.html?{query}"

                try:
                    send_mail(
                        subject="StudyO - Recuperación de contraseña",
                        message=(
                            f"Hola {user.username},\n\n"
                            "Recibimos una solicitud para restablecer tu contraseña.\n"
                            f"Usá este enlace para continuar: {reset_link}\n\n"
                            "Si no hiciste esta solicitud, podés ignorar este correo."
                        ),
                        from_email=settings.DEFAULT_FROM_EMAIL,
                        recipient_list=[user.email],
                        fail_silently=False,
                    )
                    logger.info("Password reset email sent to user_id=%s", user.id)
                except Exception:
                    logger.exception("Password reset email failed for user_id=%s", user.id)

        return Response({"detail": "If the email exists, a reset link was sent."}, status=status.HTTP_200_OK)


class PasswordResetValidateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        email = (request.query_params.get("email") or "").strip().lower()
        token = (request.query_params.get("token") or "").strip()
        if not email or not token:
            return Response({"detail": "Missing token."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        reset_token = PasswordResetToken.objects.filter(
            user=user,
            token_hash=token_hash,
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first()

        if not reset_token:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        return Response({"detail": "Token valid."}, status=status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    parser_classes = [JSONParser]

    def post(self, request):
        email = (request.data.get("email") or "").strip().lower()
        token = (request.data.get("token") or "").strip()
        new_password = request.data.get("password") or ""

        if not email or not token or not new_password:
            return Response({"detail": "Missing parameters."}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()
        reset_token = PasswordResetToken.objects.filter(
            user=user,
            token_hash=token_hash,
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first()

        if not reset_token:
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            validate_password(new_password, user=user)
        except ValidationError as exc:
            return Response({"detail": exc.messages}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        reset_token.used_at = timezone.now()
        reset_token.save(update_fields=["used_at"])

        AuthToken.objects.filter(user=user, is_active=True).update(is_active=False, expires_at=timezone.now())

        return Response({"detail": "Password updated."}, status=status.HTTP_200_OK)

