from django.apps import AppConfig


class HabitrecordConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.habitRecord'
    
    def ready(self):
        import apps.habitRecord.signals  # Importa el módulo para que se registre la seña