# ✅ DEPLOYMENT CHECKLIST - Weekly Rollover + Archiving

## Pre-Deployment

- [ ] Backup de BD (recomendado)
- [ ] Revisar los archivos de documentación:
  - `ARCHIVING_SYSTEM.md`
  - `ARCHIVING_IMPLEMENTATION_SUMMARY.md`
  - `WEEKLY_ROLLOVER_IMPLEMENTATION.md`

## Deployment Steps

### 1. Aplicar Migraciones

```bash
cd backend/studyo

# Crear migración (si no está lista)
python manage.py makemigrations

# Aplicar migración
python manage.py migrate

# Output esperado:
# Applying routine.0006_weeklyobjective_archiving... OK
```

### 2. Validar Cambios

```bash
# Test del sistema de archivado
python manage.py shell < test_archiving_system.py

# Test de rollover + idempotencia
python manage.py shell < test_weekly_rollover.py

# Output esperado: Todos los tests PASS ✓
```

### 3. Ejecutar Rollover Manual (Opcional)

```bash
# Para sincronizar objetivos viejos
python manage.py clean_weekly_objectives

# Output esperado:
# Starting weekly rollover for X users...
# ✓ user1: Rolled over Y objectives (YYYY-MM-DD to YYYY-MM-DD)
# ○ user2: No rollover needed
# Weekly rollover completed: X users processed, 0 errors
```

### 4. Verificar en BD

```bash
python manage.py shell

# Ver objetivos activos
>>> from apps.routine.models import WeeklyObjective
>>> WeeklyObjective.objects.filter(is_active=True).count()

# Ver objetivos archivados
>>> WeeklyObjective.objects.filter(is_active=False).count()

# Ver historial
>>> from apps.routine.models import WeeklyObjectiveHistory
>>> WeeklyObjectiveHistory.objects.count()

# Debe haber coherencia: archivados ≈ historial
```

### 5. Recargar Frontend

```bash
cd frontend

# Rebuild
npm run build

# O en desarrollo
npm run dev
```

### 6. Smoke Test en UI

- [ ] Abrir dashboard
- [ ] Ver que los objetivos se cargan normalmente
- [ ] Crear un objetivo nuevo
- [ ] Esperar rollover o ejecutar: `python manage.py clean_weekly_objectives`
- [ ] Verificar que el objetivo:
  - [ ] Desaparece de la lista activa
  - [ ] Aparece en el historial
  - [ ] Existe en BD (archivado, no borrado)

---

## Post-Deployment

### Monitoreo

```bash
# Ver logs del scheduler
tail -f logs/django.log | grep "rollover\|archive"

# Verificar que el scheduler está corriendo
python manage.py shell
>>> from django_apscheduler.models import DjangoJobExecution
>>> DjangoJobExecution.objects.order_by('-run_time')[:5]

# Debe haber ejecuciones cada lunes a las 00:00
```

### Verificaciones Periódicas

```bash
# Cada semana (lunes):
python manage.py clean_weekly_objectives

# Verificar que la cantidad de archivados aumenta
WeeklyObjective.objects.filter(is_active=False).count()

# Verificar que NO hay duplicados en historial
WeeklyObjectiveHistory.objects.values('user', 'week_start_date', 'week_end_date')\
    .annotate(Count('id')).filter(id__count__gt=1)
# Debe estar vacío
```

---

## Rollback (Si es necesario)

```bash
# Revertir migración
python manage.py migrate routine 0005

# Restaurar BD desde backup
# (procedimiento específico según tu setup)
```

---

## Cambios Visibles para Usuarios

### Dashboard
- ✅ Funciona igual (sin cambios visuales)
- ✅ Solo muestra objetivos activos esta semana
- ✅ Historial se llena con objetivos de semanas pasadas

### Objetivos
- ✅ Se crean normalmente
- ✅ Se editan normalmente
- ✅ Al fin de semana, se "archivan" (desaparecen de activos, aparecen en historial)

### API
- ✅ Endpoints siguen funcionando igual
- ✅ GET /api/weekly-objectives/ devuelve solo activos
- ✅ DELETE soft-archiva en lugar de borrar

---

## Cambios Internos (Para Developers)

### Modelos
- `WeeklyObjective` tiene 2 nuevos campos: `is_active`, `archived_at`

### Vistas
- `WeeklyObjectiveListCreateView`: Filtra `is_active=True`
- `WeeklyObjectiveDetailView`: Filtra `is_active=True`, soft-delete en `perform_destroy()`
- `weekly_objectives_stats()`: Dispara rollover automático

### Service
- `rollover_service.py`: Archivado en lugar de delete
- Doble protección de idempotencia
- ISO_YEAR + ISO_WEEK para edge cases

### Scheduler
- APScheduler sigue igual
- Ejecuta cada lunes a las 00:00 (hora servidor)
- Lógica está 100% en `rollover_service.py`

---

## FAQ

**P: ¿Se pierden los datos?**
R: No. Los objetivos se archivan (is_active=False), no se borran. Existen en BD.

**P: ¿Qué pasa si falla el rollover?**
R: Doble protección evita duplicados. Se loguea el error. Puedes re-ejecutar.

**P: ¿Puedo recuperar un objetivo archivado?**
R: Sí, está en BD. Podrías hacer un endpoint de "unarchive" en el futuro.

**P: ¿Afecta el performance?**
R: No. Filtro `is_active=True` es más eficiente que una tabla separada.

**P: ¿Qué pasa en fin de año?**
R: ISO_YEAR + ISO_WEEK evita confusiones entre semana 52 de 2024 y 1 de 2025.

---

## Documentación Completa

- **ARCHIVING_SYSTEM.md** → Detalles técnicos del archivado
- **ARCHIVING_IMPLEMENTATION_SUMMARY.md** → Resumen ejecutivo
- **WEEKLY_ROLLOVER_IMPLEMENTATION.md** → Sistema completo de rollover
- **test_archiving_system.py** → Tests del archivado
- **test_weekly_rollover.py** → Tests de rollover

---

## Soporte

Si algo falla:

1. Revisa los logs: `apps/routine/` y busca "archive", "rollover"
2. Ejecuta tests: `python manage.py shell < test_archiving_system.py`
3. Verifica BD manualmente
4. Contacta si hay errors específicos

---

**Status: ✅ READY FOR PRODUCTION**
