from django.contrib import admin
from .models import Book, ReadingProgress


@admin.register(Book)
class BookAdmin(admin.ModelAdmin):
    list_display = ("id", "title", "author", "user", "subject", "total_pages", "created_at")
    search_fields = ("title", "author", "user__username")
    list_filter = ("subject",)


@admin.register(ReadingProgress)
class ReadingProgressAdmin(admin.ModelAdmin):
    list_display = ("id", "book", "last_page_read", "completed", "updated_at")
    list_filter = ("completed",)
