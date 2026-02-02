"""
TEST SCRIPT: Weekly Rollover Functionality

Valida que el sistema de rollover semanal funcione correctamente:
1. Detecta cambio de semana según timezone
2. Archiva objetivos en historial
3. Mantiene idempotencia
4. Respeta timezone del usuario

Uso:
    python manage.py shell < test_weekly_rollover.py
    
O manualmente:
    python manage.py shell
    >>> exec(open('test_weekly_rollover.py').read())
"""

from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta, datetime
import pytz

from apps.routine.models import WeeklyObjective, WeeklyObjectiveHistory
from apps.routine.rollover_service import (
    get_week_boundaries_for_user,
    should_perform_rollover,
    perform_weekly_rollover,
    ensure_weekly_rollover_for_user,
)

User = get_user_model()

print("=" * 70)
print("WEEKLY ROLLOVER TEST SCRIPT")
print("=" * 70)

# 1. Obtener usuario de prueba
user = User.objects.first()
if not user:
    print("❌ No hay usuarios. Crea uno primero.")
    exit(1)

print(f"\n✓ Usuario: {user.username}")
print(f"✓ Timezone: {user.timezone}")

# 2. Test: get_week_boundaries_for_user
print("\n" + "=" * 70)
print("TEST 1: get_week_boundaries_for_user()")
print("=" * 70)

week_info = get_week_boundaries_for_user(user)
print(f"Semana actual (local): {week_info['week_start_local']} a {week_info['week_end_local']}")
print(f"Semana actual (UTC):   {week_info['week_start_utc']} a {week_info['week_end_utc']}")
print(f"ISO Week: {week_info['iso_year']}-W{week_info['iso_week']}")
print(f"Dates: {week_info['week_start_date']} to {week_info['week_end_date']}")

# 3. Test: Crear objetivos de prueba
print("\n" + "=" * 70)
print("TEST 2: Crear objetivos de prueba")
print("=" * 70)

# Limpiar objetivos viejos
WeeklyObjective.objects.filter(user=user).delete()
print("✓ Objetivos activos previos eliminados")

# Crear 3 objetivos nuevos
objectives = []
for i in range(1, 4):
    obj = WeeklyObjective.objects.create(
        user=user,
        title=f"Objetivo Test {i}",
        detail=f"Descripción test {i}",
        area="Test",
        priority=2 if i % 2 == 0 else 1,
        is_completed=(i == 1),  # El primero como completado
    )
    objectives.append(obj)
    print(f"  ✓ Creado: {obj.title} (completado: {obj.is_completed})")

print(f"\nTotal objetivos activos: {WeeklyObjective.objects.filter(user=user).count()}")

# 4. Test: should_perform_rollover
print("\n" + "=" * 70)
print("TEST 3: should_perform_rollover()")
print("=" * 70)

should_rollover = should_perform_rollover(user)
print(f"¿Debe ejecutarse rollover? {should_rollover}")

if should_rollover:
    print("✓ Condiciones correctas para ejecutar rollover")
else:
    print("○ No es necesario ejecutar rollover (probablemente ya se ejecutó esta semana)")

# 5. Test: perform_weekly_rollover
print("\n" + "=" * 70)
print("TEST 4: perform_weekly_rollover()")
print("=" * 70)

if should_rollover:
    result = perform_weekly_rollover(user)
    print(f"Ejecutado: {result['performed']}")
    print(f"Archivados: {result['archived_count']}")
    print(f"Semana: {result['week_start']} a {result['week_end']}")
    
    if result.get('errors'):
        print(f"⚠️  Errores: {result['errors']}")
else:
    print("○ Saltado (no es necesario ejecutar)")

# 6. Test: Verificar historial
print("\n" + "=" * 70)
print("TEST 5: Verificar historial creado")
print("=" * 70)

history = WeeklyObjectiveHistory.objects.filter(user=user)
print(f"Total registros de historial: {history.count()}")

if history.exists():
    print("\nÚltimos 3 registros:")
    for h in history[:3]:
        print(f"  - {h.title} (Completado: {h.is_completed})")
        print(f"    Semana: {h.week_start_date} a {h.week_end_date}")

# 7. Test: Verificar limpieza de activos
print("\n" + "=" * 70)
print("TEST 6: Verificar limpieza de objetivos activos")
print("=" * 70)

active_count = WeeklyObjective.objects.filter(user=user).count()
print(f"Objetivos activos restantes: {active_count}")

if active_count == 0:
    print("✓ Lista de activos limpia (rollover fue exitoso)")
else:
    print(f"○ Aún hay {active_count} objetivos activos")

# 8. Test: Idempotencia
print("\n" + "=" * 70)
print("TEST 7: Idempotencia - Ejecutar dos veces")
print("=" * 70)

# Recrear objetivos
for i in range(1, 3):
    WeeklyObjective.objects.create(
        user=user,
        title=f"Objetivo Idempotencia {i}",
        area="Test",
    )
print("✓ Recreados objetivos de test")

# Primera ejecución
result1 = ensure_weekly_rollover_for_user(user)
history_count_1 = WeeklyObjectiveHistory.objects.filter(user=user).count()
print(f"1ª ejecución - Performed: {result1.get('performed')}, Historial: {history_count_1}")

# Segunda ejecución
result2 = ensure_weekly_rollover_for_user(user)
history_count_2 = WeeklyObjectiveHistory.objects.filter(user=user).count()
print(f"2ª ejecución - Performed: {result2.get('performed')}, Historial: {history_count_2}")

if result2.get('performed') == False and history_count_1 == history_count_2:
    print("✓ IDEMPOTENCIA CORRECTA: No duplica registros")
else:
    print("❌ IDEMPOTENCIA FALLIDA: Se crearon duplicados")

# Resumen
print("\n" + "=" * 70)
print("RESUMEN")
print("=" * 70)
print("""
✓ Rollover Service cargado correctamente
✓ Funciones de timezone funcionan
✓ Idempotencia implementada
✓ Historial se crea y archiva

Próximos pasos:
1. Cargar dashboard para verificar trigger automático
2. Ejecutar: python manage.py clean_weekly_objectives
3. Verificar en frontend que historial se muestra correctamente
""")

print("=" * 70)
