from django.core.management.base import BaseCommand
from django.utils import timezone
from apps.notification.models import Notification

class Command(BaseCommand):
    help = 'Enviar notifications pendientes por email (programar con cron o tarea periódica).'

    def handle(self, *args, **options):
        now = timezone.now()
        qs = Notification.objects.filter(sent=False, scheduled_time__lte=now)
        total = qs.count()
        self.stdout.write(f'Found {total} pending notifications')
        sent = 0
        for n in qs:
            ok = n.send_email()
            if ok:
                sent += 1
                self.stdout.write(f'Sent notification {n.pk} to {n.user.email}')
            else:
                self.stdout.write(f'Failed sending notification {n.pk} to {n.user.email}')
        self.stdout.write(self.style.SUCCESS(f'Sent: {sent}/{total}'))
