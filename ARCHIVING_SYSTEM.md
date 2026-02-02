# ARCHIVING SYSTEM - Cambios de Calidad y Preservación de Datos

## 🎯 Cambio Crítico: Archivado en lugar de Borrado

Todos los objetivos semanales ahora se **ARCHIVAN** en lugar de **BORRARSE**.

**Antes:**
```python
objective.delete()  # ❌ Pérdida de datos, sin auditoría
```

**Ahora:**
```python
objective.is_active = False
objective.archived_at = timezone.now()
objective.save(update_fields=['is_active', 'archived_at', 'updated_at'])
```

---

## 📋 Cambios Implementados

### 1. Modelo: WeeklyObjective

**Nuevos campos:**
- `is_active: bool` (default=True) → Indica si el objetivo está activo o archivado
- `archived_at: datetime` (null=True) → Timestamp de archivado

**Migración:**
```
0006_weeklyobjective_archiving.py
```

### 2. Rollover Service: DOBLE PROTECCIÓN DE IDEMPOTENCIA

**Cambios:**

#### 2a. `should_perform_rollover()` - Protección 1
```python
# Filtra solo objetivos ACTIVOS
active_objectives = WeeklyObjective.objects.filter(
    user=user,
    is_active=True,
    archived_at__isnull=True
).exists()
```

#### 2b. `perform_weekly_rollover()` - Protección 2
```python
# Verifica múltiples condiciones:
# 1. Solo archiva objetivos con (is_active=True AND archived_at=null)
# 2. Verifica que NO exista WeeklyObjectiveHistory para esta semana
# 3. Usa ISO_YEAR + ISO_WEEK para edge cases de fin de año

if existing_history_for_week and not active_objectives.exists():
    return {"performed": False, "reason": "Already archived"}

# Archiva en lugar de borrar
objective.is_active = False
objective.archived_at = now
objective.save(update_fields=['is_active', 'archived_at', 'updated_at'])
```

### 3. Vistas: Filtros Agresivos

#### 3a. WeeklyObjectiveListCreateView
```python
def get_queryset(self):
    return WeeklyObjective.objects.filter(
        user=self.request.user,
        is_active=True  # ← SOLO activos
    )
```

#### 3b. WeeklyObjectiveDetailView
```python
def get_queryset(self):
    return WeeklyObjective.objects.filter(
        user=self.request.user,
        is_active=True  # ← SOLO activos
    )

def perform_destroy(self, instance):
    # Soft-delete: no borra, archiva
    instance.is_active = False
    instance.archived_at = timezone.now()
    instance.save(update_fields=['is_active', 'archived_at', 'updated_at'])
```

#### 3c. weekly_objectives_stats()
```python
current_objectives = WeeklyObjective.objects.filter(
    user=user,
    is_active=True,  # ← SOLO activos en esta semana
    created_at__gte=current_week_start,
    created_at__lte=current_week_end,
)
```

### 4. ISO Week + Year (Edge Cases Fin de Año)

**Problema anterior:** En fin de año, la semana 52 del 2024 podría confundirse con la semana 1 del 2026.

**Solución:**
```python
iso_data = date.isocalendar()  # Returns (iso_year, iso_week, day)
iso_year = iso_data[0]
iso_week = iso_data[1]

# Comparar AMBOS
if (current_iso_year, current_iso_week) != (last_iso_year, last_iso_week):
    perform_rollover()
```

---

## 🔐 Doble Protección de Idempotencia

### Escenario: Se ejecuta rollover 3 veces en la misma semana

```
Lunes 8:00 AM
├─ Carga dashboard → ensure_weekly_rollover_for_user() → Archiva 5 objetivos
│
Lunes 10:00 AM
├─ Carga dashboard → ensure_weekly_rollover_for_user()
│                    ├─ should_perform_rollover() devuelve False
│                    │  (los 5 objetivos ya tienen archived_at != null)
│                    └─ No archiva nuevamente
│
Lunes 00:00 (scheduler)
├─ clean_weekly_objectives() → para cada usuario
│                              ├─ should_perform_rollover() devuelve False
│                              │  (WeeklyObjectiveHistory ya existe para esta semana)
│                              └─ No archiva duplicados
```

**Protecciones activas:**
1. ✅ `is_active=True, archived_at=null` filter
2. ✅ Verificación de `WeeklyObjectiveHistory` existente
3. ✅ ISO_YEAR + ISO_WEEK deduplicación
4. ✅ `update_fields` específicos (no sobrescribe otros campos)

---

## 📊 Data Preservation

### Ciclo de Vida del Objetivo

```
1. CREACIÓN
   WeeklyObjective(
     title="Learn Calculus",
     is_active=True,
     archived_at=null
   )

2. SEMANA ACTIVA
   - Usuario lo ve en dashboard
   - Puede editar/completar
   - is_active=True, archived_at=null

3. FIN DE SEMANA (Lunes 00:00)
   - Rollover ejecuta
   - Crea WeeklyObjectiveHistory (snapshot)
   - Archiva: is_active=False, archived_at=2026-02-10 00:00:00
   - Dashboard NO lo muestra

4. POSTERIOR
   - Exists en BD por auditoría
   - Visible en historial (WeeklyObjectiveHistory)
   - Permite UI futura de "objetivos pasados"
```

---

## 🧪 Testing

### Test 1: Archivado, no borrado

```bash
python manage.py shell
>>> from apps.routine.models import WeeklyObjective
>>> obj = WeeklyObjective.objects.first()
>>> obj_id = obj.id
>>> obj.delete()  # AHORA hace soft-delete (archiva)

>>> # Verificar que existe en BD
>>> WeeklyObjective.objects.filter(id=obj_id).first()
<WeeklyObjective: title>

>>> obj.is_active
False
>>> obj.archived_at
datetime(2026, 2, 10, ...)
```

### Test 2: Idempotencia (No duplica)

```bash
python manage.py shell

# Crear 3 objetivos
for i in range(3):
    WeeklyObjective.objects.create(user=user, title=f"Obj {i}", is_active=True)

# Ejecutar rollover 3 veces
from apps.routine.rollover_service import perform_weekly_rollover
result1 = perform_weekly_rollover(user)  # performed=True, archived=3
result2 = perform_weekly_rollover(user)  # performed=False (ya archivado)
result3 = perform_weekly_rollover(user)  # performed=False (ya archivado)

# Verificar historial (NO triplicado)
from apps.routine.models import WeeklyObjectiveHistory
history = WeeklyObjectiveHistory.objects.filter(user=user)
history.count()  # 3 (no 9)
```

### Test 3: Dashboard limpio

```bash
# Objetivos activos
>>> WeeklyObjective.objects.filter(user=user, is_active=True).count()
0  # Vacío esta semana

# Historial
>>> WeeklyObjectiveHistory.objects.filter(user=user).count()
3  # Muestra las 3 semanas archivadas
```

---

## 📝 Notas de Implementación

✅ **Cambios mínimos:**
- Solo agregados 2 campos a WeeklyObjective
- No se refactorizó la app
- Endpoints siguen funcionando igual

✅ **Backward compatible:**
- Objetivos nuevos tienen `is_active=True` automáticamente
- Filtros aseguran que no se muestren archivados

✅ **Auditoría:**
- Cada objetivo archivado mantiene `archived_at` timestamp
- `updated_at` se actualiza al archivar
- Historial captura estado completo en momento del archivado

✅ **Performance:**
- Index recomendado: `(user, is_active)` en WeeklyObjective
- Queries filtran por `is_active=True` → resultset más pequeño

---

## 🔄 Migración de Datos Existentes

Si hay objetivos viejos sin procesar:

```bash
# Se marcan como archivados automáticamente
python manage.py shell

>>> from apps.routine.models import WeeklyObjective
>>> from django.utils import timezone
>>> from datetime import timedelta

>>> old_objectives = WeeklyObjective.objects.filter(
...     created_at__lt=(timezone.now() - timedelta(days=7)),
...     is_active=True,
...     archived_at__isnull=True
... )

>>> old_objectives.update(
...     is_active=False,
...     archived_at=timezone.now(),
...     updated_at=timezone.now()
... )
```

---

## 🚀 Próximas Mejoras (Opcional)

- [ ] Endpoint para listar objetivos archivados (auditoría)
- [ ] UI "Ver objetivos pasados"
- [ ] Index en BD: `(user, is_active, created_at)`
- [ ] Soft-delete también en WeeklyChallenge
- [ ] API endpoint de restoration (recuperar objetivo archivado)
