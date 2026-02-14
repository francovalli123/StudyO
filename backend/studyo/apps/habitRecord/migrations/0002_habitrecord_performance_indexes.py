from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("habitRecord", "0001_initial"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="habitrecord",
            index=models.Index(fields=["habit", "date", "completed"], name="hrec_habit_date_done_idx"),
        ),
    ]
