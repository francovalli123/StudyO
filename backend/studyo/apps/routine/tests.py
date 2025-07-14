from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth import get_user_model
from apps.routine.models import Routine
from apps.routineBlock.models import RoutineBlock
from apps.subject.models import Subject
from rest_framework import status
from datetime import date, time, timedelta

# Grupo de tests para las rutinas

User = get_user_model()

class RoutineTests(APITestCase):
    # Inicializar todo
    def setUp(self):
        self.user = User.objects.create_user(username='franco', password='clave123')
        self.client.login(username='franco', password='clave123')

        # Crear una materia para asignar a bloques
        self.subject = Subject.objects.create(user=self.user, name="Matemática", priority=1)

        self.routine_data = {
            "name": "Mi rutina",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=7)).isoformat(),
        }

        self.routine_data_with_blocks = {
            "name": "Rutina con bloques",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() + timedelta(days=7)).isoformat(),
            "blocks": [
                {
                    "subject_id": self.subject.id,
                    "day_of_week": 1,
                    "start_time": "09:00",
                    "end_time": "10:00",
                    "description": "Estudio Matemática"
                },
                {
                    "subject_id": self.subject.id,
                    "day_of_week": 2,
                    "start_time": "10:00",
                    "end_time": "11:00",
                    "description": "Estudio Matemática"
                }
            ]
        }
    
    # Crear una rutina
    def test_create_routine(self):
        url = reverse('routine_list_create')  
        response = self.client.post(url, self.routine_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], "Mi rutina")
        self.assertEqual(response.data['user_email'], self.user.email)

    # Crear una rutina con bloques rutinarios
    def test_create_routine_with_blocks(self):
        url = reverse('routine_list_create')
        response = self.client.post(url, self.routine_data_with_blocks, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(response.data['blocks']), 2)
        self.assertEqual(response.data['blocks'][0]['description'], "Estudio Matemática")

    # Listar rutinas
    def test_list_routines(self):
        Routine.objects.create(user=self.user, name="R1", start_date=date.today())
        Routine.objects.create(user=self.user, name="R2", start_date=date.today())
        url = reverse('routine_list_create')
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 2)

    # Obtener los detalles de una rutina
    def test_get_routine_detail(self):
        routine = Routine.objects.create(user=self.user, name="Detalle", start_date=date.today())
        RoutineBlock.objects.create(
            routine=routine,
            subject=self.subject,
            day_of_week=1,
            start_time=time(9, 0),
            end_time=time(10, 0),
            description="Bloque detalle"
        )
        url = reverse('routine_detail', kwargs={'pk': routine.id})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], "Detalle")
        self.assertEqual(len(response.data['blocks']), 1)
        self.assertEqual(response.data['blocks'][0]['description'], "Bloque detalle")

    # Validar fechas incorrectas
    def test_invalid_dates(self):
        url = reverse('routine_list_create')
        data = {
            "name": "Fechas inválidas",
            "start_date": date.today().isoformat(),
            "end_date": (date.today() - timedelta(days=1)).isoformat(),  # end_date anterior a start_date
        }
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("La fecha de fin debe ser posterior a la fecha de inicio.", str(response.data))
