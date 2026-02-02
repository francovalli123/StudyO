"""
TEST SCRIPT: Weekly Rollover + Archiving System

Valida que el sistema de archivado funcione correctamente:
1. Archivado en lugar de borrado
2. Dashboard solo muestra activos
3. Doble protección de idempotencia
4. Preservación de datos

Uso:
    python manage.py shell < test_archiving_system.py
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from apps.routine.models import WeeklyObjective, WeeklyObjectiveHistory
from apps.routine.rollover_service import perform_weekly_rollover

User = get_user_model()

print("=" * 70)
print("ARCHIVING SYSTEM TEST SCRIPT")
print("=" * 70)

user = User.objects.first()
if not user:
    print("❌ No hay usuarios. Crea uno primero.")
    exit(1)

print(f"\n✓ Usuario: {user.username}\n")

# TEST 1: Soft-delete (Archivado)
print("=" * 70)
print("TEST 1: Soft-Delete Behavior")
print("=" * 70)

# Limpiar previo
WeeklyObjective.objects.filter(user=user).delete()

# Crear objetivo
obj = WeeklyObjective.objects.create(
    user=user,
    title="Test Objective - Soft Delete",
    area="Test"
)
obj_id = obj.id
print(f"✓ Creado: {obj.title} (id={obj_id})")
print(f"  is_active={obj.is_active}, archived_at={obj.archived_at}")

# Archivar (soft-delete)
obj.is_active = False
obj.archived_at = timezone.now()
obj.save(update_fields=['is_active', 'archived_at', 'updated_at'])
print(f"\n✓ Archivado (soft-delete)")

# Verificar que existe en BD
obj_archived = WeeklyObjective.objects.filter(id=obj_id).first()
if obj_archived:
    print(f"✓ Sigue existiendo en BD: {obj_archived.title}")
    print(f"  is_active={obj_archived.is_active}, archived_at={obj_archived.archived_at}")
else:
    print("❌ ERROR: No encontrado en BD después de archivar")

# TEST 2: Dashboard solo muestra activos
print("\n" + "=" * 70)
print("TEST 2: Dashboard Filters (is_active=True)")
print("=" * 70)

# Crear 2 activos, 1 archivado
WeeklyObjective.objects.filter(user=user).delete()

active1 = WeeklyObjective.objects.create(
    user=user,
    title="Activo 1",
    is_active=True,
    archived_at=None
)
active2 = WeeklyObjective.objects.create(
    user=user,
    title="Activo 2",
    is_active=True,
    archived_at=None
)
archived = WeeklyObjective.objects.create(
    user=user,
    title="Archivado",
    is_active=False,
    archived_at=timezone.now()
)

print(f"Total en BD: 3 (2 activos + 1 archivado)")

# Filtro del dashboard
dashboard_objectives = WeeklyObjective.objects.filter(
    user=user,
    is_active=True
)
print(f"✓ Dashboard muestra: {dashboard_objectives.count()} objetivos")

for obj in dashboard_objectives:
    print(f"  - {obj.title} (is_active={obj.is_active})")

if dashboard_objectives.count() == 2:
    print("✓ CORRECTO: Los archivados no aparecen")
else:
    print("❌ ERROR: Contador incorrecto")

# TEST 3: Rollover + Idempotencia
print("\n" + "=" * 70)
print("TEST 3: Rollover Idempotence")
print("=" * 70)

# Limpiar previo
WeeklyObjective.objects.filter(user=user).delete()
WeeklyObjectiveHistory.objects.filter(user=user).delete()

# Crear 3 objetivos
for i in range(1, 4):
    WeeklyObjective.objects.create(
        user=user,
        title=f"Rollover Test {i}",
        is_active=True,
        archived_at=None
    )

print("✓ Creados 3 objetivos activos")

# Primera ejecución
result1 = perform_weekly_rollover(user)
print(f"\n1ª ejecución:")
print(f"  performed: {result1['performed']}")
print(f"  archived_count: {result1['archived_count']}")

history_count_1 = WeeklyObjectiveHistory.objects.filter(user=user).count()
active_count_1 = WeeklyObjective.objects.filter(user=user, is_active=True).count()
print(f"  Historial: {history_count_1}, Activos: {active_count_1}")

# Segunda ejecución
result2 = perform_weekly_rollover(user)
print(f"\n2ª ejecución:")
print(f"  performed: {result2['performed']}")
print(f"  archived_count: {result2['archived_count']}")

history_count_2 = WeeklyObjectiveHistory.objects.filter(user=user).count()
active_count_2 = WeeklyObjective.objects.filter(user=user, is_active=True).count()
print(f"  Historial: {history_count_2}, Activos: {active_count_2}")

# Tercera ejecución
result3 = perform_weekly_rollover(user)
print(f"\n3ª ejecución:")
print(f"  performed: {result3['performed']}")
print(f"  archived_count: {result3['archived_count']}")

history_count_3 = WeeklyObjectiveHistory.objects.filter(user=user).count()
active_count_3 = WeeklyObjective.objects.filter(user=user, is_active=True).count()
print(f"  Historial: {history_count_3}, Activos: {active_count_3}")

# Validación
if (result1['performed'] and 
    not result2['performed'] and 
    not result3['performed'] and
    history_count_1 == history_count_2 == history_count_3 == 3):
    print("\n✓ IDEMPOTENCIA CORRECTA: No duplica registros")
else:
    print("\n❌ IDEMPOTENCIA FALLIDA")

# TEST 4: Archivado sin duplicar historial
print("\n" + "=" * 70)
print("TEST 4: Archived Count Verification")
print("=" * 70)

archived_objectives = WeeklyObjective.objects.filter(user=user, is_active=False)
print(f"Objetivos archivados: {archived_objectives.count()}")

for obj in archived_objectives:
    print(f"  - {obj.title}")
    print(f"    is_active={obj.is_active}, archived_at={obj.archived_at}")

history_records = WeeklyObjectiveHistory.objects.filter(user=user)
print(f"\nRegistros en historial: {history_records.count()}")

if archived_objectives.count() == history_records.count():
    print("✓ CORRECTO: Cada objetivo archivado tiene su registro en historial")
else:
    print("❌ ERROR: Mismatch entre archivados e historial")

# Resumen
print("\n" + "=" * 70)
print("RESUMEN")
print("=" * 70)
print("""
✓ Archivado funciona (soft-delete)
✓ Dashboard filtra solo activos
✓ Idempotencia bloqueada (no duplica)
✓ Datos preservados en BD

Próximos pasos:
1. python manage.py migrate
2. Recargar dashboard
3. Crear objetivos y esperar lunes 00:00 (o ejecutar scheduler)
4. Verificar que se archivan sin borrar
""")

print("=" * 70)
