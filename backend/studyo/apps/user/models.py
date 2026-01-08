from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True) # Campo para el correo del usuario
    notification_preferences = models.JSONField(default=dict, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    language = models.CharField(max_length=5, default="es", help_text="User preferred UI language")

    def __str__(self):
        return self.username