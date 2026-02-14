from datetime import timedelta
import hashlib
import secrets

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import pytz

class User(AbstractUser):
    class OnboardingStep(models.TextChoices):
        CREATE_SUBJECT = 'CREATE_SUBJECT', 'Create subject'
        CREATE_HABIT = 'CREATE_HABIT', 'Create habit'
        CONFIG_POMODORO = 'CONFIG_POMODORO', 'Configure pomodoro'
        START_SESSION = 'START_SESSION', 'Start first session'
        DONE = 'DONE', 'Done'
        SKIPPED = 'SKIPPED', 'Skipped'

    email = models.EmailField(unique=True) # Campo para el correo del usuario
    created_at = models.DateTimeField(auto_now_add=True)  # Se setea al crear
    updated_at = models.DateTimeField(auto_now=True)      # Se actualiza cada vez que se guarda
    
    # Preferencias de notificación por email
    # Estructura: {
    #   "key_habits_reminder_enabled": true,
    #   "key_habits_reminder_hour": 20,  // 20:00 (8 PM) - hora local del usuario
    #   "weekly_challenge_reminder_enabled": true,
    #   "weekly_objectives_reminder_enabled": true,
    #   "weekly_summary_enabled": true
    # }
    notification_preferences = models.JSONField(
        default=dict,
        blank=True,
        help_text="Preferencias de notificación por email (estructura con keys: *_enabled y *_hour)"
    )
    
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    language = models.CharField(max_length=5, default="es", help_text="User preferred UI language")
    timezone = models.CharField(max_length=50, default='UTC', help_text="User's timezone (e.g., America/Argentina/Buenos_Aires)")
    country = models.CharField(
        max_length=100,
        blank=False,
        null=False,
        help_text="User country (ISO code)"
    )
    # Onboarding state persisted in backend so it survives refresh and sessions.
    onboarding_step = models.CharField(
        max_length=32,
        choices=OnboardingStep.choices,
        default=OnboardingStep.CREATE_SUBJECT,
    )
    onboarding_completed = models.BooleanField(default=False)

    # Mapping of countries to their primary timezones
    COUNTRY_TIMEZONE_MAP = {
        'AR': 'America/Argentina/Buenos_Aires',
        'BR': 'America/Sao_Paulo',
        'CL': 'America/Santiago',
        'CO': 'America/Bogota',
        'MX': 'America/Mexico_City',
        'PE': 'America/Lima',
        'UY': 'America/Montevideo',
        'VE': 'America/Caracas',
        'ES': 'Europe/Madrid',
        'FR': 'Europe/Paris',
        'DE': 'Europe/Berlin',
        'IT': 'Europe/Rome',
        'GB': 'Europe/London',
        'PT': 'Europe/Lisbon',
        'US': 'America/New_York',
        'CA': 'America/Toronto',
        'AU': 'Australia/Sydney',
        'JP': 'Asia/Tokyo',
        'CN': 'Asia/Shanghai',
        'IN': 'Asia/Kolkata',
        'KR': 'Asia/Seoul',
        'RU': 'Europe/Moscow',
    }

    def clean(self):
        super().clean()
        # Validate timezone
        if self.timezone:
            try:
                pytz.timezone(self.timezone)
            except pytz.exceptions.UnknownTimeZoneError:
                # Reset to UTC if invalid timezone
                self.timezone = 'UTC'
        
        # Set timezone based on country if country is provided and timezone is still default
        if self.country and self.timezone == 'UTC':
            self.timezone = self.COUNTRY_TIMEZONE_MAP.get(self.country, 'UTC')

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def get_notification_preferences(self):
        """
        Retorna preferencias de notificación con defaults inteligentes.
        Asegura que siempre haya valores válidos.
        """
        defaults = {
            'key_habits_reminder_enabled': True,
            'key_habits_reminder_hour': 20,  # 20:00 (8 PM)
            'weekly_challenge_reminder_enabled': True,
            'weekly_objectives_reminder_enabled': True,
            'weekly_summary_enabled': True,
        }
        
        # Merge con preferencias guardadas
        prefs = defaults.copy()
        if self.notification_preferences:
            prefs.update(self.notification_preferences)
        
        return prefs
    
    def is_notification_enabled(self, notification_type):
        """
        Verifica si un tipo específico de notificación está habilitado.
        
        Args:
            notification_type: 'key_habits_reminder', 'weekly_challenge_reminder', etc.
        
        Returns:
            bool: True si está habilitada
        """
        prefs = self.get_notification_preferences()
        key = f"{notification_type}_enabled"
        return prefs.get(key, True)

    def __str__(self):
        return self.username


class AuthToken(models.Model):
    key = models.CharField(max_length=40, primary_key=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="auth_tokens", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    last_activity_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "is_active"]),
            models.Index(fields=["expires_at"]),
        ]

    def __str__(self):
        return f"{self.user_id}:{self.key}"

    @classmethod
    def create_for_user(cls, user):
        now = timezone.now()
        ttl_minutes = getattr(settings, "AUTH_TOKEN_TTL_MINUTES", 60)
        key = secrets.token_hex(20)
        return cls.objects.create(
            key=key,
            user=user,
            expires_at=now + timedelta(minutes=ttl_minutes),
            last_activity_at=now,
            is_active=True,
        )

    def mark_inactive(self, reason=None):
        if not self.is_active:
            return
        self.is_active = False
        self.expires_at = min(self.expires_at, timezone.now())
        self.save(update_fields=["is_active", "expires_at"])

    def register_activity(self):
        now = timezone.now()
        if self.expires_at <= now:
            self.mark_inactive(reason="expired")
            return False

        ttl_minutes = getattr(settings, "AUTH_TOKEN_TTL_MINUTES", 60)
        refresh_window = getattr(settings, "AUTH_TOKEN_REFRESH_WINDOW_MINUTES", 10)
        # Avoid a DB write on every authenticated request.
        # Persist last activity at most every 5 minutes unless token refresh is needed.
        activity_write_interval = timedelta(minutes=5)

        should_refresh_expiry = self.expires_at - now <= timedelta(minutes=refresh_window)
        should_persist_activity = (
            self.last_activity_at is None
            or (now - self.last_activity_at) >= activity_write_interval
        )

        self.last_activity_at = now

        if should_refresh_expiry:
            self.expires_at = now + timedelta(minutes=ttl_minutes)
            self.save(update_fields=["last_activity_at", "expires_at"])
        elif should_persist_activity:
            self.save(update_fields=["last_activity_at"])
        return True


class PasswordResetToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, related_name="password_resets", on_delete=models.CASCADE)
    token_hash = models.CharField(max_length=64, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["user", "expires_at"]),
            models.Index(fields=["token_hash", "expires_at"]),
        ]

    def __str__(self):
        return f"{self.user_id}:{self.created_at.isoformat()}"

    @classmethod
    def issue_for_user(cls, user):
        now = timezone.now()
        ttl_minutes = getattr(settings, "PASSWORD_RESET_TOKEN_TTL_MINUTES", 30)
        raw_token = secrets.token_urlsafe(48)
        token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
        instance = cls.objects.create(
            user=user,
            token_hash=token_hash,
            expires_at=now + timedelta(minutes=ttl_minutes),
        )
        return instance, raw_token

    def is_valid(self):
        now = timezone.now()
        return self.used_at is None and self.expires_at > now
