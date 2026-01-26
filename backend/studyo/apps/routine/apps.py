from django.apps import AppConfig
from django.core.management import execute_from_command_line
import sys


class RoutineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.routine'

    def ready(self):
        # Only start scheduler if not running migrations
        if len(sys.argv) > 1 and sys.argv[1] in ['migrate', 'makemigrations', 'collectstatic']:
            return
        from .schedulers import start
        start()
