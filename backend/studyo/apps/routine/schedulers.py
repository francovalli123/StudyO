from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from django_apscheduler.jobstores import DjangoJobStore
from django_apscheduler.models import DjangoJobExecution
from django.conf import settings
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)

def start():
    scheduler = BackgroundScheduler(timezone=settings.TIME_ZONE)
    scheduler.add_jobstore(DjangoJobStore(), "default")

    # Limpiar objetivos semanales cada domingo a las 23:00
    scheduler.add_job(
        clean_weekly_objectives,
        trigger=CronTrigger(day_of_week="sun", hour="23"),
        id="clean_weekly_objectives",
        max_instances=1,
        replace_existing=True,
    )
    
    logger.info("Added job 'clean_weekly_objectives'.")

    scheduler.start()
    logger.info("Scheduler started!")

def clean_weekly_objectives():
    """Función que ejecuta la limpieza de objetivos semanales"""
    try:
        call_command('clean_weekly_objectives')
        logger.info("Weekly objectives cleaned successfully")
    except Exception as e:
        logger.error(f"Error cleaning weekly objectives: {e}")