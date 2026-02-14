from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("events", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="event",
            index=models.Index(fields=["user", "date", "start_time"], name="events_user_date_time_idx"),
        ),
        migrations.AddIndex(
            model_name="event",
            index=models.Index(fields=["user", "type"], name="events_user_type_idx"),
        ),
    ]

