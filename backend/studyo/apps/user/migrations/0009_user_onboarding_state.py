from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0008_alter_user_notification_preferences'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='onboarding_completed',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='user',
            name='onboarding_step',
            field=models.CharField(choices=[('CREATE_SUBJECT', 'Create subject'), ('CREATE_HABIT', 'Create habit'), ('CONFIG_POMODORO', 'Configure pomodoro'), ('START_SESSION', 'Start first session'), ('DONE', 'Done')], default='CREATE_SUBJECT', max_length=32),
        ),
    ]
