from rest_framework import serializers
from apps.subject.models import Subject
from .models import Book, ReadingProgress



class SubjectSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ["id", "name"]


class BookListSerializer(serializers.ModelSerializer):
    subject = SubjectSummarySerializer(read_only=True)
    last_page_read = serializers.SerializerMethodField()
    note = serializers.SerializerMethodField()
    completed = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = Book
        fields = [
            "id",
            "title",
            "author",
            "subject",
            "total_pages",
            "last_page_read",
            "progress",
            "note",
            "completed",
            "created_at",
        ]

    def _get_progress_obj(self, obj):
        return getattr(obj, "progress", None)

    def get_last_page_read(self, obj):
        progress = self._get_progress_obj(obj)
        if progress:
            return progress.last_page_read
        return 0

    def get_note(self, obj):
        progress = self._get_progress_obj(obj)
        if progress:
            return progress.note
        return ""

    def get_completed(self, obj):
        progress = self._get_progress_obj(obj)
        if progress:
            return bool(progress.completed)
        return False

    def get_progress(self, obj):
        if not obj.total_pages:
            return 0
        progress = self._get_progress_obj(obj)
        last_page_read = progress.last_page_read if progress else 0
        clamped = min(last_page_read, obj.total_pages)
        return clamped / obj.total_pages


class BookCreateSerializer(serializers.ModelSerializer):
    subject = serializers.PrimaryKeyRelatedField(
        queryset=Subject.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Book
        fields = ["id", "title", "author", "subject", "total_pages"]

    def validate_subject(self, value):
        if value is None:
            return value
        request = self.context.get("request")
        if request and value.user_id != request.user.id:
            raise serializers.ValidationError("Subject does not belong to the user.")
        return value

    def validate_total_pages(self, value):
        if value <= 0:
            raise serializers.ValidationError("total_pages must be greater than 0.")
        return value

    def create(self, validated_data):
        request = self.context.get("request")
        book = Book.objects.create(user=request.user, **validated_data)
        ReadingProgress.objects.get_or_create(
            book=book,
            defaults={"last_page_read": 0, "completed": False},
        )
        return book


class ReadingProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReadingProgress
        fields = ["last_page_read", "note", "completed"]

    def validate_last_page_read(self, value):
        if value < 0:
            raise serializers.ValidationError("last_page_read cannot be negative.")
        return value

    def validate(self, attrs):
        instance = self.instance
        if not instance:
            return attrs

        total_pages = instance.book.total_pages
        last_page_read = attrs.get("last_page_read", instance.last_page_read)
        completed = attrs.get("completed", instance.completed)

        if last_page_read < 0:
            raise serializers.ValidationError({"last_page_read": "last_page_read cannot be negative."})
        if last_page_read > total_pages:
            raise serializers.ValidationError({"last_page_read": "last_page_read cannot exceed total pages."})

        if completed and last_page_read < total_pages:
            raise serializers.ValidationError({"completed": "Cannot mark completed before finishing the book."})

        if last_page_read >= total_pages:
            attrs["completed"] = True

        return attrs
