from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pomodoroSession', '0001_initial'),
    ]

    operations = [
        migrations.AddConstraint(
            model_name='pomodorosession',
            constraint=models.UniqueConstraint(
                fields=('user', 'start_time', 'end_time', 'duration'),
                name='unique_pomodoro_session_per_user_time_window',
            ),
        ),
    ]
