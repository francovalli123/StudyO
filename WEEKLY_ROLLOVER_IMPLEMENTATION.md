# GUÍA DE ROLLOVER SEMANAL - QUICK REFERENCE

## Contexto de los cambios

Se implementó un sistema de **Weekly Rollover** (corte semanal) que:

1. ✅ Detecta cuando cambió la semana según el **timezone del usuario**
2. ✅ Archiva automáticamente objetivos semanales en `WeeklyObjectiveHistory`
3. ✅ Limpia la lista activa cada lunes a las 00:00 (timezone del usuario)
4. ✅ Mantiene **idempotencia**: múltiples ejecuciones NO crean duplicados
5. ✅ Carga dinámicamente: al abrir el dashboard, se verifica si debe ejecutar rollover

---

## Archivos modificados/creados

### Creados:
- **`apps/routine/rollover_service.py`** → Lógica central de rollover, respeta timezone del usuario
  - `get_week_boundaries_for_user()` → Calcula lunes/domingo según timezone
  - `should_perform_rollover()` → Detecta si cambió la semana (idempotente)
  - `perform_weekly_rollover()` → Archiva objetivos y crea historial
  - `ensure_weekly_rollover_for_user()` → Interfaz segura pública

### Modificados:
- **`apps/routine/management/commands/clean_weekly_objectives.py`**
  - Ahora usa `rollover_service` para cada usuario
  - Se ejecuta cada lunes a las 00:00 (scheduler APScheduler)
  - Mejor logging y manejo de errores

- **`apps/routine/views.py`** (función `weekly_objectives_stats`)
  - Agrega trigger automático de rollover al cargar dashboard
  - Paso 1: Ejecuta `ensure_weekly_rollover_for_user()` (idempotente)
  - Paso 2-3: Retorna estadísticas con historial actualizado

- **`apps/routine/schedulers.py`**
  - Ajusta trigger a lunes 00:00 (antes era domingo 23:00)
  - Añade documentación sobre timezone handling

---

## Cómo testear

### Test 1: Verificar rollover al cargar dashboard

```bash
# Terminal 1: Inicia el servidor
cd backend/studyo
python manage.py runserver

# Terminal 2: Carga el endpoint de stats (simula dashboard)
curl -H "Authorization: Token <YOUR_TOKEN>" \
  http://localhost:8000/api/weekly-objectives/stats/

# Resultado esperado:
# - Si es lunes y cambió la semana → objetivos se archivan automáticamente
# - `weekly_stats` muestra historial de semanas anteriores
# - Objetivo activos actuales están en la semana actual vacía
```

### Test 2: Verificar comando manual

```bash
cd backend/studyo
python manage.py clean_weekly_objectives

# Output esperado:
# Starting weekly rollover for X users...
# ✓ username: Rolled over Y objectives (YYYY-MM-DD to YYYY-MM-DD)
# ○ username: No rollover needed
# Weekly rollover completed: X users processed, 0 errors
```

### Test 3: Verificar historial en BD

```bash
cd backend/studyo
python manage.py shell

# Consulta historial
>>> from apps.routine.models import WeeklyObjectiveHistory
>>> from django.contrib.auth import get_user_model
>>> User = get_user_model()
>>> user = User.objects.first()
>>> history = WeeklyObjectiveHistory.objects.filter(user=user)
>>> history.count()  # Debe mostrar objetivos de semanas anteriores

# Ver detalles
>>> for h in history[:3]:
...     print(f"{h.title} ({h.week_start_date} to {h.week_end_date})")
```

### Test 4: Idempotencia (el rollover NO duplica registros)

```bash
# Ejecutar comando dos veces en la misma semana
python manage.py clean_weekly_objectives
# Output: ✓ user: Rolled over 5 objectives...

# Ejecutar de nuevo
python manage.py clean_weekly_objectives
# Output: ○ user: No rollover needed
# ← CORRECTO: No crea duplicados

# Verificar BD: historial debe tener la misma cantidad
```

### Test 5: Timezone respeto

En `apps/user/models.py`, cada usuario tiene atributo `timezone` (ej: "America/Buenos_Aires").

```bash
python manage.py shell
>>> user = User.objects.first()
>>> print(user.timezone)  # Debe mostrar ej: "America/Buenos_Aires"

# El rollover se ejecutará cuando sea lunes 00:00 EN ESE TIMEZONE,
# no en UTC ni en hora del servidor.
```

---

## Reglas de negocio implementadas

| Regla | Implementación |
|-------|----------------|
| Rollover cada lunes 00:00 (user timezone) | `get_week_boundaries_for_user()` en rollover_service |
| Archiva objetivos en historial | `perform_weekly_rollover()` crea `WeeklyObjectiveHistory` |
| Limpia lista activa | Elimina `WeeklyObjective` después de archivar |
| Idempotencia (sin duplicados) | `should_perform_rollover()` usa ISO week para deduplicación |
| Trigger en dashboard | `weekly_objectives_stats` llama `ensure_weekly_rollover_for_user()` |
| Trigger en scheduler | `clean_weekly_objectives` cron cada lunes 00:00 |

---

## Código clave - Locations

### Rollover Service
- **Archivo**: `apps/routine/rollover_service.py`
- **Función principal**: `ensure_weekly_rollover_for_user(user)`

### Command
- **Archivo**: `apps/routine/management/commands/clean_weekly_objectives.py`
- **Ejecuta**: `perform_weekly_rollover(user)` para cada usuario

### Trigger en Dashboard
- **Archivo**: `apps/routine/views.py` → función `weekly_objectives_stats()`
- **Línea**: Llamada a `ensure_weekly_rollover_for_user(user)` antes de retornar stats

### Scheduler
- **Archivo**: `apps/routine/schedulers.py`
- **Trigger**: `CronTrigger(day_of_week="0", hour="0", minute="0")` → Lunes 00:00

---

## Troubleshooting

### "El historial sigue mostrando 'No hay datos'"
- Verificar que `WeeklyObjectiveHistory` tenga registros en BD
- Ejecutar: `python manage.py clean_weekly_objectives`
- Reload dashboard

### "Los objetivos viejos siguen apareciendo en dashboard"
- Verificar que `weekly_objectives_stats()` incluye el trigger de rollover
- Ver logs del servidor para errores en `perform_weekly_rollover()`

### "Se crean registros duplicados en historial"
- Esto NO debe ocurrir (idempotencia implementada)
- Si ocurre: revisar ISO week calculation en `get_week_boundaries_for_user()`

### Scheduler no ejecuta
- Verificar que `django_apscheduler` está en `INSTALLED_APPS`
- Ver logs: `logger.info("Scheduler started!")`

---

## Notas de desarrollo

- ✅ Cambio MÍNIMO y SEGURO: no refactoriza la app
- ✅ Reutiliza helpers existentes (`get_user_week_range`, `timezone`)
- ✅ Transaccional: usa `@transaction.atomic` para integridad BD
- ✅ Logging completo para debugging
- ✅ Comentado: explica lógica de timezone y rollover

---

## Verificación de que todo está funcionando

```bash
# 1. Ver si los cambios están reflejados en los modelos
python manage.py makemigrations
python manage.py migrate

# 2. Ejecutar test del rollover
python manage.py clean_weekly_objectives

# 3. Cargar dashboard para trigger automático
# En frontend: abrir dashboard y monitorear en dev tools

# 4. Verificar BD
python manage.py shell
>>> from apps.routine.models import WeeklyObjectiveHistory
>>> WeeklyObjectiveHistory.objects.count()  # Debe > 0
```

Esto completa la implementación del rollover semanal con:
- ✅ Timezone awareness
- ✅ Idempotencia
- ✅ Trigger dual (scheduler + dashboard)
- ✅ Historial persistente
- ✅ Limpieza automática
