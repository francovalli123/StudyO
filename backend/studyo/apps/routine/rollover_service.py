"""
Weekly Rollover Service - Maneja el corte semanal de objetivos.

Responsabilidades:
1. Detectar si cambió la semana según timezone del usuario
2. Guardar historial semanal antes de limpiar objetivos
3. Mantener idempotencia para evitar duplicar registros

Regla de negocio:
- Cada lunes a las 00:00 (según timezone del usuario), los objetivos activos 
  se convierten en historial y se inicia una nueva semana limpia.
- La lógica es agnóstica a si se ejecuta por scheduler o por endpoint.
"""

import pytz
from datetime import timedelta
from django.utils import timezone
from django.db import transaction

from .models import WeeklyObjective, WeeklyObjectiveHistory


def get_week_boundaries_for_user(user, reference_dt=None):
    """
    Obtiene los límites de la semana actual del usuario según su timezone.
    
    Args:
        user: Usuario con atributo 'timezone'
        reference_dt: datetime de referencia (default: ahora UTC)
    
    Returns:
        dict con:
        - week_start_local: datetime inicio semana (lunes 00:00) en timezone del usuario
        - week_end_local: datetime fin semana (domingo 23:59) en timezone del usuario
        - week_start_utc: convertido a UTC
        - week_end_utc: convertido a UTC
        - iso_week: tuple (año_iso, semana_iso) para deduplicación
    """
    if reference_dt is None:
        reference_dt = timezone.now()
    
    # Convertir a timezone local del usuario
    user_tz = pytz.timezone(user.timezone)
    now_local = reference_dt.astimezone(user_tz)
    
    # Calcular lunes de la semana actual
    days_since_monday = now_local.weekday()  # 0 = Monday, 6 = Sunday
    week_start_local = (now_local - timedelta(days=days_since_monday)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    week_end_local = week_start_local + timedelta(days=6, hours=23, minutes=59, seconds=59)
    
    # Convertir a UTC para consistencia en BD
    week_start_utc = week_start_local.astimezone(pytz.UTC)
    week_end_utc = week_end_local.astimezone(pytz.UTC)
    
    # Obtener ISO week para deduplicación (evitar duplicar si corre múltiples veces)
    iso_week = week_start_local.isocalendar()  # (año_iso, semana_iso, día)
    
    return {
        "week_start_local": week_start_local,
        "week_end_local": week_end_local,
        "week_start_utc": week_start_utc,
        "week_end_utc": week_end_utc,
        "week_start_date": week_start_local.date(),
        "week_end_date": week_end_local.date(),
        "iso_year": iso_week[0],
        "iso_week": iso_week[1],
    }


def get_last_saved_week(user):
    """
    Obtiene la última semana guardada en historial para este usuario.
    Se usa para detectar si ya se ejecutó el rollover esta semana.
    
    Usa (ISO_YEAR, ISO_WEEK) para edge cases de fin de año.
    
    Returns: tuple (iso_year, iso_week) o (None, None) si no hay historial
    """
    last_history = WeeklyObjectiveHistory.objects.filter(user=user).order_by(
        '-week_start_date'
    ).first()
    
    if not last_history:
        return None, None
    
    # Recalcular ISO week a partir de week_start_date (usar ambos: año + semana)
    iso_data = last_history.week_start_date.isocalendar()
    iso_year = iso_data[0]
    iso_week = iso_data[1]
    
    return iso_year, iso_week


def should_perform_rollover(user, reference_dt=None):
    """
    Determina si se debe ejecutar el rollover semanal.
    
    DOBLE PROTECCIÓN DE IDEMPOTENCIA:
    1. Verifica última semana guardada (ISO_YEAR + ISO_WEEK)
    2. Verifica si objetivos ya tienen archived_at != null
    
    Se ejecuta solo si:
    - Hay objetivos activos (is_active=True, archived_at=null)
    - La semana ISO actual es diferente a la última guardada
    
    Esto asegura que múltiples ejecuciones NO crean registros duplicados.
    
    Args:
        user: Usuario
        reference_dt: datetime de referencia para testing
        
    Returns: bool
    """
    week_info = get_week_boundaries_for_user(user, reference_dt)
    current_iso_year = week_info["iso_year"]
    current_iso_week = week_info["iso_week"]
    
    # Obtener última semana guardada (considerando ISO_YEAR + ISO_WEEK)
    last_iso_year, last_iso_week = get_last_saved_week(user)
    
    # Si nunca se guardó historial, está OK ejecutar si hay activos
    if last_iso_year is None:
        has_active = WeeklyObjective.objects.filter(
            user=user,
            is_active=True,
            archived_at__isnull=True
        ).exists()
        return has_active
    
    # Si la semana cambió (comparar ISO_YEAR + ISO_WEEK), ejecutar rollover
    if (current_iso_year, current_iso_week) != (last_iso_year, last_iso_week):
        return True
    
    return False


@transaction.atomic
def perform_weekly_rollover(user, reference_dt=None):
    """
    Ejecuta el rollover semanal para un usuario.
    
    ARCHIVADO, NO BORRADO:
    Los objetivos se marcan como inactivos (is_active=False, archived_at=now).
    Esto preserva auditoría, analytics y permite UI futura de "objetivos pasados".
    
    DOBLE PROTECCIÓN DE IDEMPOTENCIA:
    1. Solo archiva objetivos con (is_active=True AND archived_at=null)
    2. Verifica que NO exista WeeklyObjectiveHistory para (user, iso_week, iso_year)
    
    Proceso:
    1. Obtiene objetivos activos (sin fecha de semana registrada)
    2. Calcula la semana para la que fueron creados
    3. Crea registros en WeeklyObjectiveHistory
    4. ARCHIVA objetivos (is_active=False, archived_at=now) - NO BORRA
    5. Es idempotente: múltiples ejecuciones no crean duplicados
    
    Args:
        user: Usuario para ejecutar rollover
        reference_dt: datetime de referencia (default: ahora UTC)
        
    Returns:
        dict con:
        - performed: bool si se ejecutó
        - archived_count: cantidad de objetivos archivados
        - errors: list de errores si ocurrieron
    """
    # Verificar si es necesario ejecutar
    if not should_perform_rollover(user, reference_dt):
        return {
            "performed": False,
            "archived_count": 0,
            "reason": "Rollover already performed for this week",
        }
    
    week_info = get_week_boundaries_for_user(user, reference_dt)
    now = timezone.now()
    errors = []
    archived_count = 0
    
    # PROTECCIÓN 1: Obtener solo objetivos ACTIVOS (no archivados)
    # Esto previene doble archivado si se llama múltiples veces
    active_objectives_qs = WeeklyObjective.objects.filter(
        user=user,
        is_active=True,
        archived_at__isnull=True
    )
    
    # PROTECCIÓN 2: Verificar que no exista historial para esta semana ISO
    # (triple-check para edge cases de fin de año con múltiples timezones)
    existing_history_for_week = WeeklyObjectiveHistory.objects.filter(
        user=user,
        week_start_date=week_info["week_start_date"],
        week_end_date=week_info["week_end_date"]
    ).exists()
    
    if existing_history_for_week and not active_objectives_qs.exists():
        # Ya se archivó esta semana, no hay nada que hacer
        return {
            "performed": False,
            "archived_count": 0,
            "reason": "History for this week already exists, no active objectives",
        }
    
    active_objectives = list(
        active_objectives_qs.only(
            "id", "user_id", "title", "area", "priority", "is_completed", "created_at"
        )
    )
    if not active_objectives:
        return {
            "performed": False,
            "archived_count": 0,
            "reason": "No active objectives to archive",
        }

    try:
        WeeklyObjectiveHistory.objects.bulk_create(
            [
                WeeklyObjectiveHistory(
                    user_id=objective.user_id,
                    title=objective.title,
                    area=objective.area or "General",
                    priority=objective.priority,
                    is_completed=objective.is_completed,
                    week_start_date=week_info["week_start_date"],
                    week_end_date=week_info["week_end_date"],
                    created_at=objective.created_at,
                    completed_at=now if objective.is_completed else None,
                )
                for objective in active_objectives
            ],
            batch_size=200,
        )
        archived_count = active_objectives_qs.update(
            is_active=False,
            archived_at=now,
            updated_at=now,
        )
    except Exception as e:
        errors.append(str(e))
    
    return {
        "performed": True,
        "archived_count": archived_count,
        "errors": errors if errors else None,
        "week_start": week_info["week_start_date"].isoformat(),
        "week_end": week_info["week_end_date"].isoformat(),
    }


def ensure_weekly_rollover_for_user(user, reference_dt=None):
    """
    Garantiza que el rollover semanal se haya ejecutado para el usuario.
    
    Es la interfaz pública recomendada para usar en vistas/servicios.
    - Detecta automáticamente si es necesario
    - Ejecuta si corresponde
    - Es segura para llamar múltiples veces (idempotente)
    
    Args:
        user: Usuario
        reference_dt: datetime para testing
        
    Returns: dict con resultado de la operación
    """
    if should_perform_rollover(user, reference_dt):
        return perform_weekly_rollover(user, reference_dt)
    
    return {
        "performed": False,
        "reason": "No rollover needed",
    }
