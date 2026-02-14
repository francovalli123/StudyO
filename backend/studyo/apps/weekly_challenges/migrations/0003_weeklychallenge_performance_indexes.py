from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("weekly_challenges", "0002_alter_weeklychallenge_options_and_more"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="weeklychallenge",
            index=models.Index(fields=["user", "week_start", "week_end"], name="wch_user_week_range_idx"),
        ),
        migrations.AddIndex(
            model_name="weeklychallenge",
            index=models.Index(fields=["user", "status", "week_end"], name="wch_user_status_week_end_idx"),
        ),
    ]

