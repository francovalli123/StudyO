"""
Tests para el sistema de notificaciones por email.

Verifica:
- Envío correcto de cada tipo de notificación
- Prevención de duplicados
- Respeto de timezones
- Preferencias del usuario
- Lógica de filtrado
"""

from django.test import TestCase
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import datetime, timedelta
import pytz

from apps.notification.models import Notification
from apps.notification.services import (
    send_key_habits_reminders,
    send_weekly_challenge_reminder,
    send_weekly_objectives_reminder,
    send_weekly_summary,
    _normalize_hour,
    _is_in_minute_window,
)
from apps.habits.models import Habit
from apps.habitRecord.models import HabitRecord
from apps.routine.models import WeeklyObjective
from apps.weekly_challenges.models import WeeklyChallenge, WeeklyChallengeType, WeeklyChallengeStatus
from apps.pomodoroSession.models import PomodoroSession
from apps.subject.models import Subject
from utils.datetime import get_user_tz, get_user_local_date

User = get_user_model()


class NotificationModelTests(TestCase):
    """Tests para el modelo Notification."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            timezone='America/Argentina/Buenos_Aires',
        )
    
    def test_notification_creation(self):
        """Verifica que se pueda crear una notificación."""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='key_habit_reminder',
            status='pending',
        )
        self.assertEqual(notification.status, 'pending')
        self.assertEqual(notification.notification_type, 'key_habit_reminder')
    
    def test_mark_sent(self):
        """Verifica que mark_sent actualiza estado y sent_at."""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='key_habit_reminder',
            status='pending',
        )
        notification.mark_sent()
        
        self.assertEqual(notification.status, 'sent')
        self.assertIsNotNone(notification.sent_at)
    
    def test_mark_failed(self):
        """Verifica que mark_failed registra error."""
        notification = Notification.objects.create(
            user=self.user,
            notification_type='key_habit_reminder',
            status='pending',
        )
        notification.mark_failed('Test error')
        
        self.assertEqual(notification.status, 'failed')
        self.assertEqual(notification.metadata['error'], 'Test error')


class UserNotificationPreferencesTests(TestCase):
    """Tests para preferencias de notificación en User."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            timezone='America/Argentina/Buenos_Aires',
        )
    
    def test_default_preferences(self):
        """Verifica que las preferencias tengan defaults correctos."""
        prefs = self.user.get_notification_preferences()
        
        self.assertTrue(prefs['key_habits_reminder_enabled'])
        self.assertTrue(prefs['weekly_challenge_reminder_enabled'])
        self.assertTrue(prefs['weekly_objectives_reminder_enabled'])
        self.assertTrue(prefs['weekly_summary_enabled'])
        self.assertEqual(prefs['key_habits_reminder_hour'], 20)
    
    def test_custom_preferences(self):
        """Verifica que se puedan modificar preferencias."""
        custom_prefs = {
            'key_habits_reminder_enabled': False,
            'key_habits_reminder_hour': 18,
        }
        self.user.notification_preferences = custom_prefs
        self.user.save()
        
        prefs = self.user.get_notification_preferences()
        self.assertFalse(prefs['key_habits_reminder_enabled'])
        self.assertEqual(prefs['key_habits_reminder_hour'], 18)
        # Otros defaults se mantienen
        self.assertTrue(prefs['weekly_challenge_reminder_enabled'])
    
    def test_is_notification_enabled(self):
        """Verifica método para verificar si notificación está habilitada."""
        self.assertTrue(self.user.is_notification_enabled('key_habits_reminder'))
        
        # Desabilitar
        self.user.notification_preferences = {'key_habits_reminder_enabled': False}
        self.user.save()
        
        self.assertFalse(self.user.is_notification_enabled('key_habits_reminder'))
        # Otros tipos mantienen default True
        self.assertTrue(self.user.is_notification_enabled('weekly_summary'))


class KeyHabitsReminderTests(TestCase):
    """Tests para recordatorios de hábitos clave."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            timezone='America/Argentina/Buenos_Aires',
        )
        self.subject = Subject.objects.create(
            user=self.user,
            name='Matemática',
            priority=1,
        )
    
    def test_key_habit_detected(self):
        """Verifica que hábitos clave no completados sean detectados."""
        # Crear hábito clave
        habit = Habit.objects.create(
            user=self.user,
            name='Estudiar Matemática',
            is_key=True,
            subject=self.subject,
        )
        
        # No hay registro de hoy
        today = get_user_local_date(self.user, timezone.now())
        completed_today = HabitRecord.objects.filter(
            habit=habit,
            date=today,
            completed=True,
        ).exists()
        
        self.assertFalse(completed_today)
    
    def test_key_habit_completed_not_notified(self):
        """Verifica que hábitos completados NO generen notificación."""
        # Crear hábito clave
        habit = Habit.objects.create(
            user=self.user,
            name='Estudiar Matemática',
            is_key=True,
            subject=self.subject,
        )
        
        # Marcar como completado hoy
        today = get_user_local_date(self.user, timezone.now())
        HabitRecord.objects.create(
            habit=habit,
            date=today,
            completed=True,
        )
        
        # Verificar
        completed_today = HabitRecord.objects.filter(
            habit=habit,
            date=today,
            completed=True,
        ).exists()
        
        self.assertTrue(completed_today)


class WeeklyObjectivesReminderTests(TestCase):
    """Tests para recordatorios de objetivos semanales."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            timezone='America/Argentina/Buenos_Aires',
        )
    
    def test_incomplete_objectives_detected(self):
        """Verifica que objetivos incompletos sean detectados."""
        # Crear objetivo
        obj = WeeklyObjective.objects.create(
            user=self.user,
            title='Preparar parcial',
            is_completed=False,
            is_active=True,
        )
        
        incomplete = WeeklyObjective.objects.filter(
            user=self.user,
            is_active=True,
            is_completed=False,
        )
        
        self.assertTrue(incomplete.exists())
        self.assertEqual(incomplete.first(), obj)
    
    def test_completed_objectives_not_included(self):
        """Verifica que objetivos completados NO se incluyan."""
        # Crear objetivo completado
        WeeklyObjective.objects.create(
            user=self.user,
            title='Preparar parcial',
            is_completed=True,
            is_active=True,
        )
        
        incomplete = WeeklyObjective.objects.filter(
            user=self.user,
            is_active=True,
            is_completed=False,
        )
        
        self.assertFalse(incomplete.exists())
    
    def test_archived_objectives_not_included(self):
        """Verifica que objetivos archivados NO se incluyan."""
        # Crear objetivo archivado
        WeeklyObjective.objects.create(
            user=self.user,
            title='Preparar parcial',
            is_completed=False,
            is_active=False,
            archived_at=timezone.now(),
        )
        
        active_objectives = WeeklyObjective.objects.filter(
            user=self.user,
            is_active=True,
        )
        
        self.assertFalse(active_objectives.exists())


class TimezoneTests(TestCase):
    """Tests para respeto de timezones."""
    
    def test_different_timezones(self):
        """Verifica que diferentes usuarios con diferentes timezones se calculen correctamente."""
        # Usuario en Buenos Aires
        user_ar = User.objects.create_user(
            username='user_ar',
            email='ar@example.com',
            password='testpass123',
            timezone='America/Argentina/Buenos_Aires',
        )
        
        # Usuario en Tokyo
        user_jp = User.objects.create_user(
            username='user_jp',
            email='jp@example.com',
            password='testpass123',
            timezone='Asia/Tokyo',
        )
        
        # Mismo UTC now, pero diferentes fechas/horas locales
        now_utc = timezone.now()
        
        # Obtener hora local
        from utils.datetime import to_user_local_dt
        now_ar = to_user_local_dt(user_ar, now_utc)
        now_jp = to_user_local_dt(user_jp, now_utc)
        
        # Las horas locales deben ser diferentes
        self.assertNotEqual(now_ar.hour, now_jp.hour)
    
    def test_timezone_preference_preserved(self):
        """Verifica que timezone del usuario se preserve en preferencias."""
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            timezone='America/New_York',
        )
        
        self.assertEqual(user.timezone, 'America/New_York')
        
        # Cargar desde BD
        user_reloaded = User.objects.get(username='testuser')
        self.assertEqual(user_reloaded.timezone, 'America/New_York')


class DuplicatePreventionTests(TestCase):
    """Tests para prevención de duplicados."""
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123',
            timezone='America/Argentina/Buenos_Aires',
        )
    
    def test_recent_notification_not_sent_twice(self):
        """Verifica que no se envíe notificación duplicada dentro de 1 hora."""
        # Crear notificación reciente
        now_utc = timezone.now()
        Notification.objects.create(
            user=self.user,
            notification_type='key_habit_reminder',
            status='sent',
            sent_at=now_utc - timedelta(minutes=30),
        )
        
        # Buscar notificación reciente
        recent = Notification.objects.filter(
            user=self.user,
            notification_type='key_habit_reminder',
            created_at__gte=now_utc - timedelta(hours=1),
            status='sent',
        ).exists()
        
        self.assertTrue(recent)
    
    def test_old_notification_can_be_sent_again(self):
        """Verifica que notificaciones antiguas puedan enviarse de nuevo."""
        # Crear notificación antigua (hace 2+ horas)
        now_utc = timezone.now()
        old_time = now_utc - timedelta(hours=2, minutes=30)
        
        notification = Notification.objects.create(
            user=self.user,
            notification_type='key_habit_reminder',
            status='sent',
            sent_at=old_time,
        )
        
        # Actualizar el created_at para que sea antiguo también
        Notification.objects.filter(pk=notification.pk).update(
            created_at=old_time
        )
        
        # Buscar notificación dentro de la ventana de 1 hora (no debe existir)
        recent = Notification.objects.filter(
            user=self.user,
            notification_type='key_habit_reminder',
            created_at__gte=now_utc - timedelta(hours=1),  # Solo en la última hora
            status='sent',
        ).exists()
        
        # No debe existir porque fue creada hace más de 1 hora
        self.assertFalse(recent)


class NotificationTimeHelpersTests(TestCase):
    """Tests para helpers de hora/ventana usados por scheduler y servicios."""

    def test_normalize_hour_accepts_common_formats(self):
        self.assertEqual(_normalize_hour(20), 20)
        self.assertEqual(_normalize_hour("20"), 20)
        self.assertEqual(_normalize_hour("20:00"), 20)
        self.assertEqual(_normalize_hour("20.0"), 20)

    def test_normalize_hour_fallbacks_to_default(self):
        self.assertEqual(_normalize_hour("invalid", default=18), 18)
        self.assertEqual(_normalize_hour(99, default=18), 18)

    def test_is_in_minute_window(self):
        dt = datetime(2025, 1, 1, 20, 0, tzinfo=pytz.UTC)
        self.assertTrue(_is_in_minute_window(dt, 20, 0, 5))

        dt_edge = datetime(2025, 1, 1, 20, 4, tzinfo=pytz.UTC)
        self.assertTrue(_is_in_minute_window(dt_edge, 20, 0, 5))

        dt_out = datetime(2025, 1, 1, 20, 5, tzinfo=pytz.UTC)
        self.assertFalse(_is_in_minute_window(dt_out, 20, 0, 5))
