from django.contrib.auth.models import User
from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.validators import UnicodeUsernameValidator
from django.conf import settings
from .security import validate_registration_email_or_raise, verify_signup_captcha

# Crea un serializer basado en modelo (User) para convertir datos JSON <-> objetos Python, y aplicar validaciones automáticas

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(write_only=True)
    country = serializers.CharField(required=True)
    captcha_id = serializers.CharField(write_only=True)
    captcha_answer = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = (
            "username",
            "email",
            "password",
            "first_name",
            "last_name",
            "country",
            "captcha_id",
            "captcha_answer",
        )
    def validate_username(self, value):
        validator = UnicodeUsernameValidator(
            message=(
                "El nombre de usuario solo puede tener letras, numeros y @/./+/-/_. "
                "No se permiten espacios ni caracteres especiales."
            )
        )
        validator(value)

        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya existe.")

        return value

    def validate_email(self, value):
        normalized = (value or "").strip().lower()
        if User.objects.filter(email__iexact=normalized).exists():
            raise serializers.ValidationError("Este correo electrónico ya está en uso.")

        try:
            validate_registration_email_or_raise(normalized)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

        return normalized

    def validate(self, attrs):
        captcha_ok = verify_signup_captcha(
            attrs.get("captcha_id", ""),
            attrs.get("captcha_answer", ""),
        )
        if not captcha_ok:
            raise serializers.ValidationError({"captcha": "Captcha inválido o expirado."})

        return attrs

    def create(self, validated_data):
        validated_data.pop("captcha_id", None)
        validated_data.pop("captcha_answer", None)
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
class UserSerializer(serializers.ModelSerializer):
    """Serializer para obtener información del usuario (sin contraseña)"""
    avatar = serializers.ImageField(read_only=True)
    avatar_url = serializers.SerializerMethodField()
    preferences = serializers.SerializerMethodField()
    language = serializers.CharField(read_only=True)
    timezone = serializers.CharField(read_only=True)
    country = serializers.CharField(read_only=True)
    onboarding_step = serializers.CharField(read_only=True)
    onboarding_completed = serializers.BooleanField(read_only=True)
    subjects_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "avatar", "avatar_url", "preferences",
            "language", "timezone", "country", "onboarding_step", "onboarding_completed", "subjects_count"
        ]
        read_only_fields = ["id", "username"]

    def get_avatar_url(self, obj):
        if not getattr(obj, "avatar", None):
            return None
        url = obj.avatar.url
        request = self.context.get("request")
        if request is not None:
            return request.build_absolute_uri(url)
        site_url = getattr(settings, "SITE_URL", "").rstrip("/")
        return f"{site_url}{url}" if site_url else url

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

    def get_subjects_count(self, obj):
        # Used by onboarding trigger (first login or no subjects)
        try:
            return obj.subjects.count()
        except Exception:
            return 0
