from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pomodoroSession", "0002_unique_pomodoro_session_per_user_time_window"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="pomodorosession",
            index=models.Index(fields=["user", "start_time"], name="pomodoro_user_start_time_idx"),
        ),
        migrations.AddIndex(
            model_name="pomodorosession",
            index=models.Index(fields=["user", "subject", "start_time"], name="pom_user_subj_start_idx"),
        ),
    ]
