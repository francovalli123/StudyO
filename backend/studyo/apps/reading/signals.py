from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

from .models import Book, ReadingProgress


@receiver(post_save, sender=Book)
def create_reading_progress(sender, instance, created, **kwargs):
    if created:
        ReadingProgress.objects.get_or_create(
            book=instance,
            defaults={"last_page_read": 0, "completed": False},
        )


@receiver(post_delete, sender=Book)
def delete_book_file(sender, instance, **kwargs):
    file_field = getattr(instance, "file", None)
    if not file_field:
        return
    try:
        storage = file_field.storage
        name = file_field.name
        if name and storage.exists(name):
            storage.delete(name)
    except Exception:
        # Avoid blocking deletion on storage errors.
        pass
