"""
URL configuration for studyo project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.user.views import *
from apps.weekly_challenges.views import ActiveWeeklyChallengeView
from rest_framework.authtoken.views import obtain_auth_token
from apps.habits.views import *
from apps.habitRecord.views import *
from apps.subject.views import *
from apps.routine.views import *
from apps.pomodoroSession.views import *
from apps.events.views import *

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/signup/', RegisterView.as_view(), name="api_signup"),
    path('api/login/', obtain_auth_token, name='api_login'),
    path('api/user/me/', CurrentUserView.as_view(), name='current_user'),
    path('api/logout/', LogoutView.as_view(), name="api_logout"),
    path('api/delete-account/', DeleteAccountView.as_view(), name='delete_account'),
    path('api/habits/', HabitListCreateView.as_view(), name='habit_list_create'),
    path('api/habits/<int:pk>/', HabitDetailView.as_view(), name='habit_detail'),
    path('api/habits/<int:habit_id>/complete/', CompleteHabitView.as_view(), name='complete_habit'),
    path('api/subjects/',SubjectListCreateView.as_view(), name='subject_list_create'),
    path('api/subjects/<int:pk>/', SubjectDetailView.as_view(), name='subject_detail'),
    path('api/routines/', RoutineListCreateView.as_view(), name='routine_list_create'),
    path('api/routine/<int:pk>/', RoutineDetailView.as_view(), name="routine_detail"),
    path('api/routines/generate/', generate_routine, name='routine_generate'),
    path('api/weekly-objectives/', WeeklyObjectiveListCreateView.as_view(), name='weekly_objective_list_create'),
    path('api/weekly-objectives/<int:pk>/', WeeklyObjectiveDetailView.as_view(), name='weekly_objective_detail'),
    path('api/weekly-objectives/stats/', weekly_objectives_stats, name='weekly_objectives_stats'),
    path('api/pomodoro/', PomodoroSessionCreateView.as_view(), name='pomodoro_list_create'),
    path('api/pomodoro/<int:pk>/', PomodoroSessionDetailView.as_view(), name='pomodoro_detail'),
    path('api/events/', EventListCreateView.as_view(), name='event_list_create'),
    path('api/events/<int:pk>/', EventDetailView.as_view(), name='event_detail'),
    path('api/weekly-challenge/active/', ActiveWeeklyChallengeView.as_view(), name='active_weekly_challenge'),

]

# Serve user uploaded media files during development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
