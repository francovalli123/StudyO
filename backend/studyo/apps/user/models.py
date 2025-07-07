from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    email = models.EmailField(unique=True) # Campo para el correo del usuario
    notification_preferences = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.username