from django.contrib.auth.models import AbstractUser
from django.db import models
import pytz

class User(AbstractUser):
    email = models.EmailField(unique=True) # Campo para el correo del usuario
    notification_preferences = models.JSONField(default=dict, blank=True)
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

    def __str__(self):
        return self.username