from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django.conf import settings
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

def start():
    """
    Inicializa el scheduler de APScheduler para tareas periódicas.
    
    Se ejecuta automáticamente al iniciar la aplicación (via AppConfig.ready()).
    
    Tareas programadas (todas respetan el timezone del usuario):
    1. Rollover semanal: cada lunes a las 00:00 UTC (sin conversión necesaria)
    2. Recordatorios de hábitos clave: cada hora (verifica 20:00 en timezone local del usuario)
    3. Recordatorio de desafío semanal: cada hora (verifica domingo 12:00 en timezone local)
    4. Recordatorio de objetivos semanales: cada hora (verifica sábado 12:00 en timezone local)
    5. Resumen semanal: cada hora (verifica lunes 00:05 en timezone local)
    """
    scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # ROLLOVER SEMANAL: Cada lunes a las 00:00 UTC
    # Este job usa UTC porque el rollover es universal para todos los usuarios
    scheduler.add_job(
        clean_weekly_objectives,
        trigger=CronTrigger(day_of_week="0", hour="0", minute="0"),  # Monday 00:00 UTC
        id="clean_weekly_objectives",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'clean_weekly_objectives' - Weekly rollover every Monday at 00:00 UTC")

    # RECORDATORIOS DE HÁBITOS CLAVE: Cada hora
    # Dentro del job se verifica si es hora 20:00 en el timezone local de cada usuario
    scheduler.add_job(
        send_key_habits_reminders_job,
        trigger=CronTrigger(minute="0"),  # Cada hora en punto
        id="send_key_habits_reminders",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_key_habits_reminders' - Every hour (checks user's local timezone for 20:00)")

    # RECORDATORIO DESAFÍO SEMANAL: Cada hora
    # Dentro del job se verifica si es domingo a las 12:00 en el timezone local de cada usuario
    scheduler.add_job(
        send_weekly_challenge_reminder_job,
        trigger=CronTrigger(minute="0"),  # Cada hora en punto
        id="send_weekly_challenge_reminder",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_weekly_challenge_reminder' - Every hour (checks user's local timezone for Sunday 12:00)")

    # RECORDATORIO OBJETIVOS SEMANALES: Cada hora
    # Dentro del job se verifica si es sábado a las 12:00 en el timezone local de cada usuario
    scheduler.add_job(
        send_weekly_objectives_reminder_job,
        trigger=CronTrigger(minute="0"),  # Cada hora en punto
        id="send_weekly_objectives_reminder",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_weekly_objectives_reminder' - Every hour (checks user's local timezone for Saturday 12:00)")

    # RESUMEN SEMANAL: Cada hora
    # Dentro del job se verifica si es lunes a las 00:05 en el timezone local de cada usuario
    scheduler.add_job(
        send_weekly_summary_job,
        trigger=CronTrigger(minute="0"),  # Cada hora en punto
        id="send_weekly_summary",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_weekly_summary' - Every hour (checks user's local timezone for Monday 00:05)")

    scheduler.start()
    logger.info("Scheduler started with all notification jobs!")


def clean_weekly_objectives():
    """
    Función que ejecuta la limpieza y archivación de objetivos semanales.
    Se ejecuta desde el scheduler cada lunes a las 00:00 UTC.
    """
    try:
        call_command('clean_weekly_objectives')
        logger.info("Weekly objectives cleaned successfully")
    except Exception as e:
        logger.error(f"Error cleaning weekly objectives: {e}")


def send_key_habits_reminders_job():
    """
    Wrapper para ejecutar envío de recordatorios de hábitos clave desde APScheduler.
    """
    try:
        from apps.notification.services import send_key_habits_reminders
        send_key_habits_reminders()
    except Exception as e:
        logger.error(f"Error in send_key_habits_reminders_job: {e}")


def send_weekly_challenge_reminder_job():
    """
    Wrapper para ejecutar envío de recordatorio de desafío semanal desde APScheduler.
    """
    try:
        from apps.notification.services import send_weekly_challenge_reminder
        send_weekly_challenge_reminder()
    except Exception as e:
        logger.error(f"Error in send_weekly_challenge_reminder_job: {e}")


def send_weekly_objectives_reminder_job():
    """
    Wrapper para ejecutar envío de recordatorio de objetivos semanales desde APScheduler.
    """
    try:
        from apps.notification.services import send_weekly_objectives_reminder
        send_weekly_objectives_reminder()
    except Exception as e:
        logger.error(f"Error in send_weekly_objectives_reminder_job: {e}")


def send_weekly_summary_job():
    """
    Wrapper para ejecutar envío de resumen semanal desde APScheduler.
    """
    try:
        from apps.notification.services import send_weekly_summary
        send_weekly_summary()
    except Exception as e:
        logger.error(f"Error in send_weekly_summary_job: {e}")
