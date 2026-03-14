import os
from django.core.exceptions import ValidationError
from pypdf import PdfReader


MAX_PDF_SIZE_BYTES = 50 * 1024 * 1024


def _validate_pdf_extension(file):
    name = getattr(file, "name", "") or ""
    _, ext = os.path.splitext(name.lower())
    if ext != ".pdf":
        raise ValidationError("Only PDF files are allowed.")


def _validate_pdf_mime_type(file):
    content_type = getattr(file, "content_type", None)
    if content_type != "application/pdf":
        raise ValidationError("Only PDF files are allowed.")


def _validate_pdf_size(file):
    size = getattr(file, "size", None)
    if size is None:
        return
    if size > MAX_PDF_SIZE_BYTES:
        raise ValidationError("PDF file size must be 50MB or smaller.")


def validate_pdf_file(file):
    _validate_pdf_extension(file)
    _validate_pdf_mime_type(file)
    _validate_pdf_size(file)


def get_pdf_page_count(file):
    validate_pdf_file(file)
    try:
        try:
            file.seek(0)
        except Exception:
            pass
        reader = PdfReader(file)
        total_pages = len(reader.pages)
        if total_pages <= 0:
            raise ValidationError("Invalid PDF file.")
        return total_pages
    except ValidationError:
        raise
    except Exception as exc:
        raise ValidationError("Invalid PDF file.") from exc
    finally:
        try:
            file.seek(0)
        except Exception:
            pass
