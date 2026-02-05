from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('user', '0009_user_onboarding_state'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='onboarding_step',
            field=models.CharField(
                max_length=32,
                choices=[
                    ('CREATE_SUBJECT', 'Create subject'),
                    ('CREATE_HABIT', 'Create habit'),
                    ('CONFIG_POMODORO', 'Configure pomodoro'),
                    ('START_SESSION', 'Start first session'),
                    ('DONE', 'Done'),
                    ('SKIPPED', 'Skipped'),
                ],
                default='CREATE_SUBJECT',
            ),
        ),
    ]
