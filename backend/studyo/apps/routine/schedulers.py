from apscheduler.executors.pool import ThreadPoolExecutor
from apscheduler.jobstores.memory import MemoryJobStore
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django.conf import settings
from django.core.management import call_command
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.util import close_old_connections
import logging
import os

try:
    import fcntl
except ImportError:  # pragma: no cover - Windows fallback
    fcntl = None

logger = logging.getLogger(__name__)
_scheduler = None
_scheduler_lock_handle = None


def _acquire_scheduler_lock():
    """
    Evita múltiples instancias del scheduler (especialmente en entornos multiproceso).
    """
    global _scheduler_lock_handle
    if fcntl is None:
        return True
    if _scheduler_lock_handle is not None:
        return True
    lock_path = os.path.join("/tmp", "studyo_apscheduler.lock")
    lock_handle = open(lock_path, "a+", encoding="utf-8")
    try:
        fcntl.flock(lock_handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        lock_handle.close()
        return False
    _scheduler_lock_handle = lock_handle
    return True


def _is_sqlite_backend():
    return settings.DATABASES.get("default", {}).get("ENGINE") == "django.db.backends.sqlite3"

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
    global _scheduler

    if _scheduler and _scheduler.running:
        logger.info("Scheduler is already running, skipping new initialization")
        return _scheduler

    if not _acquire_scheduler_lock():
        logger.warning("Scheduler lock already held; skipping start to avoid duplicate instances.")
        return _scheduler

    job_defaults = {
        "coalesce": True,
        "max_instances": 1,
        "misfire_grace_time": 300,
    }
    executors = {
        "default": ThreadPoolExecutor(max_workers=1 if _is_sqlite_backend() else 5),
    }
    scheduler = BackgroundScheduler(
        timezone=settings.TIME_ZONE,
        job_defaults=job_defaults,
        executors=executors,
    )
    if _is_sqlite_backend():
        scheduler.add_jobstore(MemoryJobStore(), "default")
    else:
        scheduler.add_jobstore(DjangoJobStore(), "default")

    # ROLLOVER SEMANAL: Cada lunes a las 00:00 UTC
    # Este job usa UTC porque el rollover es universal para todos los usuarios
    scheduler.add_job(
        clean_weekly_objectives,
        trigger=CronTrigger(day_of_week="0", hour="0", minute="0"),  # Monday 00:00 UTC
        id="clean_weekly_objectives",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    
    logger.info("Added job 'clean_weekly_objectives' - Weekly rollover every Monday at 00:00 UTC")

    # RECORDATORIOS DE HÁBITOS CLAVE: Cada hora
    # Dentro del job se verifica si es hora 20:00 en el timezone local de cada usuario
    scheduler.add_job(
        send_key_habits_reminders_job,
        trigger=CronTrigger(minute="*/5"),  # Cada 5 min para tolerar reinicios/desfase
        id="send_key_habits_reminders",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_key_habits_reminders' - Every 5 minutes (checks user's local timezone for configured hour)")

    # RECORDATORIO DESAFÍO SEMANAL: Cada hora
    # Dentro del job se verifica si es domingo a las 12:00 en el timezone local de cada usuario
    scheduler.add_job(
        send_weekly_challenge_reminder_job,
        trigger=CronTrigger(minute="*/5"),  # Cada 5 min para tolerar reinicios/desfase
        id="send_weekly_challenge_reminder",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_weekly_challenge_reminder' - Every 5 minutes (checks user's local timezone for Sunday 12:00)")

    # RECORDATORIO OBJETIVOS SEMANALES: Cada hora
    # Dentro del job se verifica si es sábado a las 12:00 en el timezone local de cada usuario
    scheduler.add_job(
        send_weekly_objectives_reminder_job,
        trigger=CronTrigger(minute="*/5"),  # Cada 5 min para tolerar reinicios/desfase
        id="send_weekly_objectives_reminder",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_weekly_objectives_reminder' - Every 5 minutes (checks user's local timezone for Saturday 12:00)")

    # RESUMEN SEMANAL: Cada hora
    # Dentro del job se verifica si es lunes a las 00:05 en el timezone local de cada usuario
    scheduler.add_job(
        send_weekly_summary_job,
        trigger=CronTrigger(minute="*/5"),  # Cada 5 min para tolerar reinicios/desfase
        id="send_weekly_summary",
        max_instances=1,
        coalesce=True,
        replace_existing=True,
    )
    
    logger.info("Added job 'send_weekly_summary' - Every 5 minutes (checks user's local timezone for Monday 00:05)")

    scheduler.start()
    _scheduler = scheduler
    logger.info("Scheduler started with all notification jobs!")
    return scheduler


@close_old_connections
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


@close_old_connections
def send_key_habits_reminders_job():
    """
    Wrapper para ejecutar envío de recordatorios de hábitos clave desde APScheduler.
    """
    try:
        from apps.notification.services import send_key_habits_reminders
        send_key_habits_reminders()
    except Exception as e:
        logger.error(f"Error in send_key_habits_reminders_job: {e}")


@close_old_connections
def send_weekly_challenge_reminder_job():
    """
    Wrapper para ejecutar envío de recordatorio de desafío semanal desde APScheduler.
    """
    try:
        from apps.notification.services import send_weekly_challenge_reminder
        send_weekly_challenge_reminder()
    except Exception as e:
        logger.error(f"Error in send_weekly_challenge_reminder_job: {e}")


@close_old_connections
def send_weekly_objectives_reminder_job():
    """
    Wrapper para ejecutar envío de recordatorio de objetivos semanales desde APScheduler.
    """
    try:
        from apps.notification.services import send_weekly_objectives_reminder
        send_weekly_objectives_reminder()
    except Exception as e:
        logger.error(f"Error in send_weekly_objectives_reminder_job: {e}")


@close_old_connections
def send_weekly_summary_job():
    """
    Wrapper para ejecutar envío de resumen semanal desde APScheduler.
    """
    try:
        from apps.notification.services import send_weekly_summary
        send_weekly_summary()
    except Exception as e:
        logger.error(f"Error in send_weekly_summary_job: {e}")
