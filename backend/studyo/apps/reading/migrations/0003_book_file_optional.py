from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("reading", "0002_book_subject_optional"),
    ]

    operations = [
        migrations.AlterField(
            model_name="book",
            name="file",
            field=models.FileField(blank=True, null=True, upload_to="books/"),
        ),
    ]
