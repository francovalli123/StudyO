from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from apps.subject.models import Subject
from apps.habits.models import Habit
from apps.habitRecord.models import HabitRecord
from datetime import date

User = get_user_model()

class SubjectProgressTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='franco', password='clave123')
        self.client.login(username='franco', password='clave123')

        # Creo una materia sin hábitos (progress debería ser 0)
        self.subject = Subject.objects.create(
            user=self.user,
            name='Matemática',
            priority=1
        )

    def test_progress_no_habits(self):
        url = reverse('subject_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['progress'], 0)

    def test_progress_with_habits_completed(self):
        # Creo 3 hábitos asociados a la materia
        habit1 = Habit.objects.create(user=self.user, name='Estudio 1', frequency=1, subject=self.subject)
        habit2 = Habit.objects.create(user=self.user, name='Estudio 2', frequency=1, subject=self.subject)
        habit3 = Habit.objects.create(user=self.user, name='Estudio 3', frequency=1, subject=self.subject)

        today = date.today()
        # Marco 2 hábitos como completados hoy
        HabitRecord.objects.create(habit=habit1, date=today, completed=True)
        HabitRecord.objects.create(habit=habit2, date=today, completed=True)
        # El tercero no está completado

        url = reverse('subject_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        expected_progress = int((2 / 3) * 100)
        self.assertEqual(response.data[0]['progress'], expected_progress)
