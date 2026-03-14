from django.apps import AppConfig


class ReadingConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.reading"

    def ready(self):
        from . import signals  # noqa: F401
