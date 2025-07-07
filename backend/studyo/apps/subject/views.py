from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import SubjectSerializer
from .models import Subject

# Boceto para view de materia

# Crear y listar materias
class SubjectListCreateView(ListCreateAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]  # Un usuario no puede crear una materia sin estar autenticado
 
    def get_queryset(self):
        # Devuelve solo las materias del usuario autenticado
        return Subject.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        # Asigna el usuario automáticamente
        serializer.save(user=self.request.user)

# Detalles, edición y eliminación de un hábito
class SubjectDetailView(RetrieveUpdateDestroyAPIView):
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Subject.objects.filter(user=self.request.user())