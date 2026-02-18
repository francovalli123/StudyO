import os
import dj_database_url
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Cargar variables de entorno
load_dotenv(BASE_DIR / ".env")

# ======================
# CONFIGURACIÓN DE RENDER
# ======================
IS_RENDER = os.getenv("RENDER", "").lower() == "true"

# Quick-start development settings
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-default-key")
DEBUG = os.getenv("DEBUG", "False") == "True"

if IS_RENDER:
    DEBUG = False

ALLOWED_HOSTS = [
    "studyo.onrender.com",
    "localhost",
    "127.0.0.1",
]

# ======================
# APLICACIONES
# ======================
INSTALLED_APPS = [
    'apps.user',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'apps.subject',
    'apps.routine',
    'apps.habits',
    'apps.notification',
    'apps.pomodoroSession',
    'apps.routineBlock',
    'apps.weekly_challenges',
    'apps.habitRecord.apps.HabitrecordConfig',
    'apps.events.apps.EventsConfig',
    'corsheaders',
    'django_apscheduler',
    'rest_framework',
]

# Cloudinary Logic
USE_CLOUDINARY_MEDIA = bool(
    os.getenv("CLOUDINARY_URL") or 
    (os.getenv("CLOUDINARY_CLOUD_NAME") and os.getenv("CLOUDINARY_API_KEY"))
)

if USE_CLOUDINARY_MEDIA:
    INSTALLED_APPS += ["cloudinary", "cloudinary_storage"]

# ======================
# MIDDLEWARE
# ======================
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware', # Debe ir después de SecurityMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ======================
# STORAGES (Corregido para Django 5.2+)
# ======================
STORAGES = {
    "default": {
        "BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage" if USE_CLOUDINARY_MEDIA else "django.core.files.storage.FileSystemStorage",
    },
    "staticfiles": {
        # Usamos CompressedStaticFilesStorage en lugar de Manifest para evitar errores de booteo si falla el collectstatic
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

if USE_CLOUDINARY_MEDIA:
    CLOUDINARY_STORAGE = {"SECURE": True}

# ======================
# DATABASE
# ======================
DATABASES = {
    "default": dj_database_url.config(
        default=os.getenv("DATABASE_URL"),
        conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", 120)),
        ssl_require=IS_RENDER # Solo requiere SSL en producción (Render)
    )
}
DATABASES["default"]["CONN_HEALTH_CHECKS"] = True

# ======================
# EMAIL CONFIG (SendGrid)
# ======================
SENDGRID_API_KEY = os.environ.get("SENDGRID_API_KEY")
if IS_RENDER and not SENDGRID_API_KEY:
    raise RuntimeError("SENDGRID_API_KEY is missing in environment variables.")

EMAIL_BACKEND = "sendgrid_backend.SendgridBackend"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "covexarg@gmail.com")
SENDGRID_ECHO_TO_STDOUT = DEBUG

# ======================
# REST & AUTH
# ======================
AUTH_USER_MODEL = 'user.User'
ROOT_URLCONF = 'studyo.urls'
WSGI_APPLICATION = 'studyo.wsgi.application'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.user.authentication.ExpiringTokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

# ======================
# SEGURIDAD & CORS
# ======================
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")
USE_X_FORWARDED_HOST = True

CORS_ALLOWED_ORIGINS = [
    "https://study-o.vercel.app",
    "http://localhost:3000",
    "http://localhost:5500",
    "http://127.0.0.1:3000",
]
CSRF_TRUSTED_ORIGINS = CORS_ALLOWED_ORIGINS

# ======================
# STATIC & MEDIA
# ======================
STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ======================
# OTROS
# ======================
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Variables personalizadas de la App
SITE_NAME = 'StudyO'
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://study-o.vercel.app')
SITE_URL = os.environ.get('SITE_URL', 'https://studyo.onrender.com')
AUTH_TOKEN_TTL_MINUTES = int(os.environ.get('AUTH_TOKEN_TTL_MINUTES', 60))