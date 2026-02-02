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
    
    Tareas programadas:
    - Rollover semanal: cada lunes a las 00:00 (hora del servidor)
      Archiva objetivos de la semana anterior en historial y limpia la lista activa.
    """
    scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # ROLLOVER SEMANAL: Cada lunes a las 00:00 (hora del servidor)
    # La lógica de timezone del usuario está en rollover_service.perform_weekly_rollover()
    # Cada usuario que cargue el dashboard recibe rollover inteligente según su timezone.
    # Este scheduler es un RESPALDO que asegura que se ejecute aunque el usuario no cargue.
    scheduler.add_job(
        clean_weekly_objectives,
        trigger=CronTrigger(day_of_week="0", hour="0", minute="0"),  # Monday 00:00
        id="clean_weekly_objectives",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'clean_weekly_objectives' - Weekly rollover every Monday at 00:00")

    scheduler.start()
    logger.info("Scheduler started!")

def clean_weekly_objectives():
    """
    Función que ejecuta la limpieza y archivación de objetivos semanales.
    
    Se ejecuta desde el scheduler cada lunes a las 00:00 (hora del servidor).
    
    Proceso:
    1. Para cada usuario activo, detecta si cambió la semana según su timezone
    2. Archiva objetivos activos en WeeklyObjectiveHistory
    3. Limpia la lista activa
    4. Mantiene idempotencia: no crea duplicados si corre múltiples veces
    
    La lógica realiza rollover INTELIGENTE por usuario, considerando sus timezones.
    """
    try:
        call_command('clean_weekly_objectives')
        logger.info("Weekly objectives cleaned successfully")
    except Exception as e:
        logger.error(f"Error cleaning weekly objectives: {e}")
