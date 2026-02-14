from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("habits", "0002_habit_is_key"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="habit",
            index=models.Index(fields=["user", "is_key"], name="habits_habit_user_is_key_idx"),
        ),
        migrations.AddIndex(
            model_name="habit",
            index=models.Index(fields=["user", "created_at"], name="habits_habit_user_created_idx"),
        ),
    ]

