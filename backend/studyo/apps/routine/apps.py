from django.apps import AppConfig
import sys
import os


_scheduler_started = False


class RoutineConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.routine'

    def ready(self):
        global _scheduler_started

        # Avoid scheduler during commands that should be short-lived.
        blocked_commands = {
            'migrate',
            'makemigrations',
            'collectstatic',
            'test',
            'shell',
            'dbshell',
            'createsuperuser',
        }
        if len(sys.argv) > 1 and sys.argv[1] in blocked_commands:
            return

        # When Django autoreload is enabled, only start the scheduler in the
        # serving process (RUN_MAIN=true), not in the file-watcher parent.
        if len(sys.argv) > 1 and sys.argv[1] == 'runserver' and os.environ.get('RUN_MAIN') != 'true':
            return

        if _scheduler_started:
            return

        from .schedulers import start
        start()
        _scheduler_started = True
