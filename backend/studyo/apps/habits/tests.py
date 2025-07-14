from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth.models import User
from .models import Habit
from apps.habitRecord.models import HabitRecord
from django.urls import reverse
from datetime import date
from django.contrib.auth import get_user_model

# Grupo de pruebas para el habito

User = get_user_model()

class HabitTests(APITestCase):

    # Inicializar (crear algunos habitos de prueba)

    def setUp(self):
        self.user = User.objects.create_user(username='franco', password='clave123')
        self.client.login(username='franco', password='clave123')

        self.habit = Habit.objects.create(
            user=self.user,
            name='Estudiar análisis',
            frequency=1,
            # No paso ninguna materia porque no tengo creada ninguna, recordemos que subject es opcional
        )

        self.habit_data = {
            "name": "Estudiar análisis",
            "frequency": 1,
        }

    # Crear hábito
    def test_create_habit(self):
        response = self.client.post('/api/habits/', self.habit_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Estudiar análisis")

    # Listar habitos
    def test_get_habit_list(self):
        self.client.post('/api/habits/', self.habit_data, format='json')
        response = self.client.get('/api/habits/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

    # Marcar un hábito como completado. Se espera que se actualice la racha
    def test_mark_habit_completed_updates_streak(self):
        url = reverse('complete_habit', kwargs={'habit_id': self.habit.id})

        # POST para marcar completado
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Verificamos que se creó el HabitRecord
        self.assertEqual(HabitRecord.objects.filter(habit=self.habit, date=date.today()).count(), 1)

        self.habit.refresh_from_db()
        self.assertEqual(response.data['streak'], self.habit.streak)
        self.assertTrue(self.habit.streak >= 1)
    