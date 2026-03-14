import io
import os
import shutil
import tempfile

from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APITestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from pypdf import PdfWriter

from apps.subject.models import Subject
from .models import Book, ReadingProgress


User = get_user_model()


def make_pdf_bytes(page_count=1):
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_blank_page(width=72, height=72)
    stream = io.BytesIO()
    writer.write(stream)
    return stream.getvalue()


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class ReadingTrackerTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="reader",
            email="reader@example.com",
            password="pass123",
        )
        self.other_user = User.objects.create_user(
            username="other",
            email="other@example.com",
            password="pass123",
        )
        self.subject = Subject.objects.create(user=self.user, name="Math")
        self.other_subject = Subject.objects.create(user=self.other_user, name="History")
        self.client.login(username="reader", password="pass123")

    def tearDown(self):
        media_root = settings.MEDIA_ROOT
        if media_root and os.path.isdir(media_root):
            shutil.rmtree(media_root, ignore_errors=True)

    def _upload_book(self, name="sample.pdf", content_type="application/pdf", data=None):
        payload = data or make_pdf_bytes(page_count=2)
        upload = SimpleUploadedFile(name, payload, content_type=content_type)
        response = self.client.post(
            "/api/books/",
            {
                "title": "Test Book",
                "author": "Author",
                "subject": self.subject.id,
                "file": upload,
            },
            format="multipart",
        )
        return response

    def test_pdf_upload_valid(self):
        response = self._upload_book()
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        book_id = response.data.get("id")
        self.assertTrue(Book.objects.filter(id=book_id, user=self.user).exists())
        progress = ReadingProgress.objects.filter(book_id=book_id).first()
        self.assertIsNotNone(progress)
        self.assertEqual(progress.last_page_read, 0)
        self.assertFalse(progress.completed)

    def test_pdf_upload_invalid_extension(self):
        response = self._upload_book(name="sample.txt")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pdf_upload_invalid_mime_type(self):
        response = self._upload_book(content_type="text/plain")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pdf_upload_invalid_size(self):
        large_payload = b"0" * (50 * 1024 * 1024 + 1)
        response = self._upload_book(data=large_payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_pdf_upload_invalid_structure(self):
        response = self._upload_book(data=b"not a pdf")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_progress_update_validation(self):
        response = self._upload_book()
        book_id = response.data["id"]

        invalid = self.client.patch(
            f"/api/books/{book_id}/progress/",
            {"last_page_read": 999},
            format="json",
        )
        self.assertEqual(invalid.status_code, status.HTTP_400_BAD_REQUEST)

        negative = self.client.patch(
            f"/api/books/{book_id}/progress/",
            {"last_page_read": -1},
            format="json",
        )
        self.assertEqual(negative.status_code, status.HTTP_400_BAD_REQUEST)

        valid = self.client.patch(
            f"/api/books/{book_id}/progress/",
            {"last_page_read": 2},
            format="json",
        )
        self.assertEqual(valid.status_code, status.HTTP_200_OK)
        self.assertTrue(valid.data.get("completed"))

    def test_permission_checks(self):
        response = self._upload_book()
        book_id = response.data["id"]

        self.client.logout()
        self.client.login(username="other", password="pass123")

        detail = self.client.get(f"/api/books/{book_id}/")
        self.assertIn(detail.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

        progress = self.client.patch(
            f"/api/books/{book_id}/progress/",
            {"last_page_read": 1},
            format="json",
        )
        self.assertIn(progress.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

        delete = self.client.delete(f"/api/books/{book_id}/")
        self.assertIn(delete.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

    def test_delete_book_removes_file(self):
        response = self._upload_book()
        book_id = response.data["id"]
        book = Book.objects.get(id=book_id)
        file_path = book.file.path
        self.assertTrue(os.path.exists(file_path))

        delete_response = self.client.delete(f"/api/books/{book_id}/")
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(os.path.exists(file_path))
        self.assertFalse(ReadingProgress.objects.filter(book_id=book_id).exists())
