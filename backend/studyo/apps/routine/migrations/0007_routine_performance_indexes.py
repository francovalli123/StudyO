from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("routine", "0006_weeklyobjective_archiving"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="weeklyobjective",
            index=models.Index(fields=["user", "is_active", "created_at"], name="wobj_user_active_created_idx"),
        ),
        migrations.AddIndex(
            model_name="weeklyobjective",
            index=models.Index(fields=["user", "is_completed", "archived_at"], name="weekly_obj_user_done_arch_idx"),
        ),
        migrations.AddIndex(
            model_name="weeklyobjectivehistory",
            index=models.Index(fields=["user", "week_start_date"], name="whist_user_week_start_idx"),
        ),
        migrations.AddIndex(
            model_name="weeklyobjectivehistory",
            index=models.Index(fields=["user", "is_completed", "week_start_date"], name="weekly_hist_user_done_week_idx"),
        ),
    ]
