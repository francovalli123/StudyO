from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Habit, HabitRecord
from .serializers import HabitSerializer, HabitRecordSerializer
from django.db.models import Count, Q
from datetime import datetime, timedelta

#Requisitos funcionales
#Crear hábitos: El usuario puede definir un nuevo hábito (por ejemplo, "Leer 30 min de apuntes").
#Listar hábitos: El usuario puede ver todos sus hábitos.
#Ver detalles de un hábito: Obtener información específica de un hábito, incluyendo estadísticas de completado (vía registros).
#Editar hábitos: El usuario puede modificar la descripción o frecuencia de un hábito.
#Eliminar hábitos: El usuario puede borrar un hábito.
#Marcar hábitos como completados: El usuario puede registrar si completó un hábito en un día específico (esto implica interactuar con RegistroHábito).
#Visualización de progreso: Proveer datos para el dashboard de progreso (por ejemplo, porcentaje de hábitos completados por semana/mes).

#Requisitos no funcionales relevantes:
#Seguridad: Solo el usuario propietario del hábito puede acceder o modificarlo.
#Usabilidad: Las respuestas de la API deben ser claras y consistentes para facilitar la integración con el frontend.
#Rendimiento: Las consultas deben ser optimizadas para cargar en ~3 segundos.
#Mantenibilidad: El código debe ser modular y estar bien documentado.

