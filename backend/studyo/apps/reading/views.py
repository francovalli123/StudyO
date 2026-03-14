from django.shortcuts import get_object_or_404
from rest_framework.generics import ListCreateAPIView, RetrieveDestroyAPIView, UpdateAPIView
from rest_framework.permissions import IsAuthenticated

from .models import Book, ReadingProgress
from .serializers import BookListSerializer, BookCreateSerializer, ReadingProgressSerializer


class BookListCreateView(ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            Book.objects.filter(user=self.request.user)
            .select_related("subject", "progress")
            .order_by("-created_at")
        )

    def get_serializer_class(self):
        if self.request.method == "POST":
            return BookCreateSerializer
        return BookListSerializer


class BookDetailView(RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BookListSerializer

    def get_queryset(self):
        return Book.objects.filter(user=self.request.user).select_related("subject", "progress")


class BookProgressUpdateView(UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ReadingProgressSerializer

    def get_queryset(self):
        return ReadingProgress.objects.filter(book__user=self.request.user).select_related("book")

    def get_object(self):
        return get_object_or_404(self.get_queryset(), book_id=self.kwargs["pk"])
