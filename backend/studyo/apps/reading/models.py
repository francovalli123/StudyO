from django.conf import settings
from django.db import models
from apps.subject.models import Subject


class Book(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="books",
    )
    title = models.CharField(max_length=200)
    author = models.CharField(max_length=200)
    subject = models.ForeignKey(
        Subject,
        on_delete=models.CASCADE,
        related_name="books",
    )
    file = models.FileField(upload_to="books/")
    total_pages = models.PositiveIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user})"


class ReadingProgress(models.Model):
    book = models.OneToOneField(
        Book,
        on_delete=models.CASCADE,
        related_name="progress",
    )
    last_page_read = models.PositiveIntegerField(default=0)
    note = models.CharField(max_length=200, blank=True)
    completed = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Progress for {self.book.title}"
