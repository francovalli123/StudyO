"""
Servicios de notificaciones por email para StudyO.

Este módulo contiene la lógica centralizada para:
- Detección de qué notificaciones enviar
- Filtrado por timezone del usuario
- Envío de emails con templates
- Registro de notificaciones en la BD
- Prevención de duplicados
"""

import logging
from datetime import datetime, timedelta
import pytz
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives
from django.conf import settings
from django.utils import timezone
from django.db.models import Q
from apps.user.models import User
from apps.notification.models import Notification
from apps.habits.models import Habit
from apps.habitRecord.models import HabitRecord
from apps.routine.models import WeeklyObjective
from apps.weekly_challenges.models import WeeklyChallenge, WeeklyChallengeStatus
from apps.pomodoroSession.models import PomodoroSession
from apps.subject.models import Subject
from utils.datetime import get_user_tz, to_user_local_dt, get_user_local_date

logger = logging.getLogger(__name__)


def _normalize_hour(raw_hour, default=20):
    """Convierte diferentes formatos de hora a entero [0..23]."""
    try:
        if isinstance(raw_hour, str):
            # Soporta "20", "20:00", "20.0"
            raw_hour = raw_hour.split(':', 1)[0]
        hour = int(float(raw_hour))
        if 0 <= hour <= 23:
            return hour
    except (TypeError, ValueError):
        pass
    return default


def _is_in_minute_window(now_local, target_hour, target_minute=0, window_minutes=5):
    """Retorna True si now_local cae dentro de una ventana corta del horario objetivo."""
    if now_local.hour != target_hour:
        return False
    return target_minute <= now_local.minute < (target_minute + window_minutes)


def send_notification_email(user, notification_type, subject, template_name, context):
    """
    Envía un email de notificación y registra en la BD.
    
    Args:
        user: Instancia de User
        notification_type: Tipo de notificación (key_habit_reminder, etc.)
        subject: Asunto del email
        template_name: Nombre del template (sin .html)
        context: Contexto para renderizar el template
    
    Returns:
        Notification: Instancia creada o None si falló
    """
    try:
        # Preparar contexto
        context.update({
            'user': user,
            'site_name': getattr(settings, 'SITE_NAME', 'StudyO'),
            'site_url': getattr(settings, 'SITE_URL', 'https://studyo.onrender.com'),
        })
        
        # Renderizar template
        template_path = f'notification/{template_name}.html'
        html_body = render_to_string(template_path, context)
        text_body = f"Notificación de {settings.SITE_NAME}: {subject}\n\nVisita StudyO para más detalles."
        
        # Crear email
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email]
        )
        email.attach_alternative(html_body, "text/html")
        
        # Enviar
        email.send(fail_silently=False)
        
        # Registrar en BD
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            status='sent',
            sent_at=timezone.now(),
            message=subject,
            metadata=context.get('metadata', {}),
        )
        
        logger.info(f"[Notification] {user.username} - {notification_type}: sent successfully")
        return notification
        
    except Exception as e:
        logger.error(f"[Notification] {user.username} - {notification_type}: {str(e)}")
        # Intentar registrar como fallido
        try:
            notification = Notification.objects.create(
                user=user,
                notification_type=notification_type,
                status='failed',
                message=subject,
                metadata={'error': str(e)},
            )
        except Exception as db_e:
            logger.error(f"[Notification] Failed to record error: {str(db_e)}")
        return None


def send_key_habits_reminders():
    """
    Envía recordatorios de hábitos clave a todos los usuarios.
    
    Se ejecuta cada hora, pero solo envía si es la hora correcta en el timezone del usuario.
    
    Para cada usuario:
    - Convierte la hora actual a su timezone
    - Verifica si es la hora configurada (default 20:00) en su timezone
    - Verifica si la notificación está habilitada
    - Filtra hábitos clave no completados hoy
    - Envía email para cada hábito
    
    Nota: Si el usuario no tiene timezone definido, usa UTC como default
    """
    logger.info("[send_key_habits_reminders] Starting task...")
    sent_count = 0
    failed_count = 0
    
    # Hora UTC actual
    now_utc = timezone.now()
    
    # Iterar usuarios
    for user in User.objects.filter(is_active=True):
        try:
            # Obtener timezone del usuario (default UTC si no está definido)
            user_tz = get_user_tz(user)
            now_local = to_user_local_dt(user, now_utc)
            
            # Verificar si notificaciones están habilitadas
            if not user.is_notification_enabled('key_habits_reminder'):
                continue
            
            # Obtener hora configurada (default 20:00)
            prefs = user.get_notification_preferences()
            reminder_hour = _normalize_hour(prefs.get('key_habits_reminder_hour', 20), default=20)
            
            # Verificar si es la hora correcta en el timezone local del usuario
            if not _is_in_minute_window(now_local, reminder_hour, target_minute=0, window_minutes=5):
                continue
            
            # Prevenir envío duplicado (solo una vez por hora)
            recent_notification = Notification.objects.filter(
                user=user,
                notification_type='key_habit_reminder',
                created_at__gte=now_utc - timedelta(hours=1),
                status='sent',
            ).exists()
            
            if recent_notification:
                logger.debug(f"[send_key_habits_reminders] {user.username}: Already sent in last hour, skipping")
                continue
            
            # Obtener hábitos clave no completados hoy
            today = get_user_local_date(user, now_utc)
            key_habits = user.habits.filter(is_key=True)
            
            incomplete_habits = []
            for habit in key_habits:
                # Verificar si se completó hoy
                completed_today = HabitRecord.objects.filter(
                    habit=habit,
                    date=today,
                    completed=True,
                ).exists()
                
                if not completed_today:
                    incomplete_habits.append(habit)
            
            # Enviar recordatorios
            for habit in incomplete_habits:
                subject = f"Recordatorio: {habit.name} - Hábito Clave"
                context = {
                    'habit_name': habit.name,
                    'habit_description': f"Frecuencia: {habit.get_frequency_display()}",
                    'habit_frequency': habit.get_frequency_display(),
                    'metadata': {'habit_id': habit.id},
                }
                
                if send_notification_email(user, 'key_habit_reminder', subject, 'key_habit_reminder', context):
                    sent_count += 1
                else:
                    failed_count += 1
        
        except Exception as e:
            logger.error(f"[send_key_habits_reminders] Error processing {user.username}: {str(e)}")
            failed_count += 1
    
    logger.info(f"[send_key_habits_reminders] Completed: {sent_count} sent, {failed_count} failed")


def send_weekly_challenge_reminder():
    """
    Envía recordatorio de desafío semanal.
    
    Se ejecuta cada hora, pero solo envía si es domingo a las 12:00 PM en el timezone local del usuario.
    
    Para cada usuario:
    - Convierte a su timezone (debe ser domingo 12:00)
    - Verifica si notificaciones están habilitadas
    - Verifica si el desafío NO fue completado
    - Envía email con progreso
    
    Nota: Si el usuario no tiene timezone definido, usa UTC como default
    """
    logger.info("[send_weekly_challenge_reminder] Starting task...")
    sent_count = 0
    failed_count = 0
    
    now_utc = timezone.now()
    
    for user in User.objects.filter(is_active=True):
        try:
            # Obtener timezone del usuario (default UTC si no está definido)
            user_tz = get_user_tz(user)
            now_local = to_user_local_dt(user, now_utc)
            
            # Verificar si es domingo (weekday=6) a las 12:00 en timezone local
            if now_local.weekday() != 6 or not _is_in_minute_window(now_local, 12, target_minute=0, window_minutes=5):
                continue
            
            # Verificar si notificaciones están habilitadas
            if not user.is_notification_enabled('weekly_challenge_reminder'):
                continue
            
            # Prevenir duplicado
            recent_notification = Notification.objects.filter(
                user=user,
                notification_type='weekly_challenge_reminder',
                created_at__gte=now_utc - timedelta(hours=2),
                status='sent',
            ).exists()
            
            if recent_notification:
                logger.debug(f"[send_weekly_challenge_reminder] {user.username}: Already sent recently, skipping")
                continue
            
            # Obtener desafío semanal activo
            from apps.weekly_challenges.evaluators import get_week_boundaries
            week_start, week_end = get_week_boundaries(user, now_utc)
            
            challenge = WeeklyChallenge.objects.filter(
                user=user,
                week_start=week_start,
                week_end=week_end,
                status=WeeklyChallengeStatus.ACTIVE,
            ).first()
            
            if not challenge:
                logger.debug(f"[send_weekly_challenge_reminder] {user.username}: No active challenge")
                continue
            
            # Calcular progreso
            progress = int((challenge.current_value / challenge.target_value * 100) if challenge.target_value > 0 else 0)
            progress = min(99, progress)  # No mostrar 100% si no está completado
            
            subject = f"Recordatorio: Desafío Semanal - {challenge.get_challenge_type_display()}"
            context = {
                'challenge_name': challenge.get_challenge_type_display(),
                'challenge_description': f"Completá este desafío para obtener recompensas",
                'current_value': challenge.current_value,
                'target_value': challenge.target_value,
                'progress': progress,
                'metadata': {'challenge_id': challenge.id},
            }
            
            if send_notification_email(user, 'weekly_challenge_reminder', subject, 'weekly_challenge_reminder', context):
                sent_count += 1
            else:
                failed_count += 1
        
        except Exception as e:
            logger.error(f"[send_weekly_challenge_reminder] Error processing {user.username}: {str(e)}")
            failed_count += 1
    
    logger.info(f"[send_weekly_challenge_reminder] Completed: {sent_count} sent, {failed_count} failed")


def send_weekly_objectives_reminder():
    """
    Envía recordatorio de objetivos semanales.
    
    Se ejecuta cada hora, pero solo envía si es sábado a las 12:00 PM en el timezone local del usuario.
    
    Para cada usuario:
    - Convierte a su timezone
    - Verifica si hay objetivos incompletos
    - Envía email con lista de objetivos pendientes
    
    Nota: Si el usuario no tiene timezone definido, usa UTC como default
    """
    logger.info("[send_weekly_objectives_reminder] Starting task...")
    sent_count = 0
    failed_count = 0
    
    now_utc = timezone.now()
    
    for user in User.objects.filter(is_active=True):
        try:
            # Obtener timezone del usuario (default UTC si no está definido)
            user_tz = get_user_tz(user)
            now_local = to_user_local_dt(user, now_utc)
            
            # Verificar si es sábado (weekday=5) a las 12:00 en timezone local
            if now_local.weekday() != 5 or not _is_in_minute_window(now_local, 12, target_minute=0, window_minutes=5):
                continue
            
            # Verificar si notificaciones están habilitadas
            if not user.is_notification_enabled('weekly_objectives_reminder'):
                continue
            
            # Prevenir duplicado
            recent_notification = Notification.objects.filter(
                user=user,
                notification_type='weekly_objectives_reminder',
                created_at__gte=now_utc - timedelta(hours=2),
                status='sent',
            ).exists()
            
            if recent_notification:
                logger.debug(f"[send_weekly_objectives_reminder] {user.username}: Already sent recently, skipping")
                continue
            
            # Obtener objetivos activos no completados
            incomplete_objectives = WeeklyObjective.objects.filter(
                user=user,
                is_active=True,
                is_completed=False,
            ).order_by('-priority')
            
            if not incomplete_objectives.exists():
                logger.debug(f"[send_weekly_objectives_reminder] {user.username}: No incomplete objectives")
                continue
            
            # Calcular días restantes hasta fin de semana
            today = now_local.date()
            sunday = today + timedelta(days=(6 - today.weekday()))
            days_left = (sunday - today).days
            
            subject = f"Recordatorio: Tienes {incomplete_objectives.count()} objetivo(s) pendiente(s)"
            context = {
                'objectives': incomplete_objectives[:5],  # Max 5 en el email
                'incomplete_count': incomplete_objectives.count(),
                'days_left': max(1, days_left),
                'metadata': {'objectives_count': incomplete_objectives.count()},
            }
            
            if send_notification_email(user, 'weekly_objectives_reminder', subject, 'weekly_objectives_reminder', context):
                sent_count += 1
            else:
                failed_count += 1
        
        except Exception as e:
            logger.error(f"[send_weekly_objectives_reminder] Error processing {user.username}: {str(e)}")
            failed_count += 1
    
    logger.info(f"[send_weekly_objectives_reminder] Completed: {sent_count} sent, {failed_count} failed")


def send_weekly_summary():
    """
    Envía resumen semanal de progreso.
    
    Se ejecuta cada hora, pero solo envía si es lunes a las 00:05 en el timezone local del usuario.
    
    Para cada usuario:
    - Convierte a su timezone
    - Calcula estadísticas de la semana anterior
    - Envía email con resumen
    
    Nota: Si el usuario no tiene timezone definido, usa UTC como default
    """
    logger.info("[send_weekly_summary] Starting task...")
    sent_count = 0
    failed_count = 0
    
    now_utc = timezone.now()
    
    for user in User.objects.filter(is_active=True):
        try:
            # Obtener timezone del usuario (default UTC si no está definido)
            user_tz = get_user_tz(user)
            now_local = to_user_local_dt(user, now_utc)
            
            # Verificar si es lunes (weekday=0) a las 00:05 en timezone local
            if now_local.weekday() != 0 or not _is_in_minute_window(now_local, 0, target_minute=5, window_minutes=5):
                continue
            
            # Verificar si notificaciones están habilitadas
            if not user.is_notification_enabled('weekly_summary'):
                continue
            
            # Prevenir duplicado
            recent_notification = Notification.objects.filter(
                user=user,
                notification_type='weekly_summary',
                created_at__gte=now_utc - timedelta(hours=2),
                status='sent',
            ).exists()
            
            if recent_notification:
                logger.debug(f"[send_weekly_summary] {user.username}: Already sent recently, skipping")
                continue
            
            # Calcular semana anterior (en timezone del usuario)
            today = now_local.date()
            this_monday = today - timedelta(days=today.weekday())
            last_monday = this_monday - timedelta(days=7)
            last_sunday = this_monday - timedelta(days=1)
            
            # Convertir fechas a UTC para consultas a BD
            tz = user_tz
            last_monday_utc_start = tz.localize(datetime.combine(last_monday, datetime.min.time())).astimezone(pytz.UTC)
            last_sunday_utc_end = tz.localize(datetime.combine(last_sunday, datetime.max.time())).astimezone(pytz.UTC)
            
            # Obtener estadísticas
            pomodoro_sessions = PomodoroSession.objects.filter(
                user=user,
                start_time__gte=last_monday_utc_start,
                start_time__lte=last_sunday_utc_end,
            )
            
            pomodoro_count = pomodoro_sessions.count()
            total_study_minutes = pomodoro_sessions.aggregate(total=models.Sum('duration'))['total'] or 0
            total_study_hours = round(total_study_minutes / 60, 1)
            
            # Objetivos completados
            completed_objectives = WeeklyObjective.objects.filter(
                user=user,
                is_completed=True,
                archived_at__gte=last_monday_utc_start,
                archived_at__lte=last_sunday_utc_end,
            ).count()
            
            total_objectives = WeeklyObjective.objects.filter(
                user=user,
                archived_at__gte=last_monday_utc_start,
                archived_at__lte=last_sunday_utc_end,
            ).count()
            
            # Consistencia (días con al menos 1 pomodoro)
            days_with_study = set()
            for session in pomodoro_sessions:
                session_date = get_user_local_date(user, session.start_time)
                if last_monday <= session_date <= last_sunday:
                    days_with_study.add(session_date)
            
            consistency_percentage = int((len(days_with_study) / 7) * 100) if len(days_with_study) > 0 else 0
            
            # Desafío semanal completado
            from apps.weekly_challenges.evaluators import get_week_boundaries
            week_start, week_end = get_week_boundaries(user, last_monday_utc_start)
            
            challenge_completed = WeeklyChallenge.objects.filter(
                user=user,
                week_start=week_start,
                week_end=week_end,
                status=WeeklyChallengeStatus.COMPLETED,
            ).exists()
            
            subject = f"Resumen Semanal - {last_monday.strftime('%d/%m')} al {last_sunday.strftime('%d/%m')}"
            context = {
                'pomodoro_count': pomodoro_count,
                'total_study_hours': total_study_hours,
                'objectives_completed': completed_objectives,
                'objectives_total': total_objectives or 1,  # Evitar división por cero
                'consistency_percentage': consistency_percentage,
                'challenge_completed': challenge_completed,
                'week_start': last_monday.strftime('%d/%m/%Y'),
                'week_end': last_sunday.strftime('%d/%m/%Y'),
                'metadata': {
                    'pomodoro_count': pomodoro_count,
                    'study_hours': total_study_hours,
                },
            }
            
            if send_notification_email(user, 'weekly_summary', subject, 'weekly_summary', context):
                sent_count += 1
            else:
                failed_count += 1
        
        except Exception as e:
            logger.error(f"[send_weekly_summary] Error processing {user.username}: {str(e)}")
            failed_count += 1
    
    logger.info(f"[send_weekly_summary] Completed: {sent_count} sent, {failed_count} failed")


# Import Django models para agregaciones
from django.db import models
