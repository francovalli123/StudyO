# Generated migration for archiving support

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('routine', '0005_weeklyobjectivehistory'),
    ]

    operations = [
        migrations.AddField(
            model_name='weeklyobjective',
            name='is_active',
            field=models.BooleanField(default=True, help_text='False cuando se archiva al final de la semana'),
        ),
        migrations.AddField(
            model_name='weeklyobjective',
            name='archived_at',
            field=models.DateTimeField(blank=True, null=True, help_text='Timestamp de archivado'),
        ),
    ]
