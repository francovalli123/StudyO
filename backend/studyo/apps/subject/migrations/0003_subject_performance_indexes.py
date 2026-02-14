from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("subject", "0002_subject_weekly_target_minutes"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="subject",
            index=models.Index(fields=["user", "next_exam_date"], name="subject_user_exam_date_idx"),
        ),
        migrations.AddIndex(
            model_name="subject",
            index=models.Index(fields=["user", "priority"], name="subject_user_priority_idx"),
        ),
    ]

