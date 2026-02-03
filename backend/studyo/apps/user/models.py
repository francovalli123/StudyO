from django.contrib.auth.models import AbstractUser
from django.db import models
import pytz

class User(AbstractUser):
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