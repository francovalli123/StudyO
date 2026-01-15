from django.apps import AppConfig


class RoutineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.routine'

    def ready(self):
        import apps.routine.signals
