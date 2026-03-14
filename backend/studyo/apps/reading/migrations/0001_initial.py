from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("subject", "0003_subject_performance_indexes"),
    ]

    operations = [
        migrations.CreateModel(
            name="Book",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("title", models.CharField(max_length=200)),
                ("author", models.CharField(max_length=200)),
                ("file", models.FileField(upload_to="books/")),
                ("total_pages", models.PositiveIntegerField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                (
                    "subject",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="books", to="subject.subject"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="books", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ReadingProgress",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("last_page_read", models.PositiveIntegerField(default=0)),
                ("note", models.CharField(blank=True, max_length=200)),
                ("completed", models.BooleanField(default=False)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "book",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="progress", to="reading.book"),
                ),
            ],
        ),
    ]
