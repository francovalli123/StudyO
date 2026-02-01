# Quick Reference - loadWeeklyChallenge()

## 📋 Resumen Rápido

La función `loadWeeklyChallenge()` carga y renderiza el desafío semanal activo del usuario desde el backend.

**Ubicación:** `frontend/src/ts/dashboard.ts`

---

## 🚀 Uso

### Uso Automático (Recomendado)
Se carga automáticamente cuando se carga el dashboard:
```typescript
// En dashboard.ts - línea ~1740
await loadDashboard(); // Incluye loadWeeklyChallenge()
```

### Uso Manual
```typescript
// Desde cualquier script
import { loadWeeklyChallenge } from './dashboard.js';

// Llamar la función
await loadWeeklyChallenge();
```

---

## 📊 Datos que Devuelve el API

**Endpoint:** `GET /api/weekly-challenge/active/`

**Headers requeridos:**
```
Authorization: Token <AUTH_TOKEN>
```

**Respuesta (200 OK):**
```json
{
  "id": 1,
  "title": "Racha de Enfoque Élite - 5 Pomodoros/día",
  "description": "Completá 5 Pomodoros diarios por 5 días seguidos...",
  "current_value": 3,
  "target_value": 5,
  "progress_percentage": 60.0,
  "status": "active",
  "progress": 3,
  "target_days": 5,
  "required_pomodoros_per_day": 5,
  "completed_days": ["2026-02-01", "2026-02-02", "2026-02-03"],
  "week_start": "2026-02-01",
  "week_end": "2026-02-07"
}
```

**Respuesta (204 No Content / null):**
No hay desafío activo - muestra estado vacío

---

## 🎨 Renderizado

### Elemento Target
```html
<div data-challenge-container>
  <!-- Se reemplaza con contenido dinámico -->
</div>
```

### Estructura Renderizada (Activo)
```html
<div class="space-y-4">
  <div class="flex justify-between items-start">
    <div class="flex-1">
      <h3>Racha de Enfoque Élite - 5 Pomodoros/día</h3>
      <p>Completá 5 Pomodoros diarios por 5 días seguidos...</p>
    </div>
    <span class="badge badge-active">⚡ Activo</span>
  </div>
  
  <div class="space-y-2">
    <div class="progress-bar">
      <div class="progress-fill" style="width: 60%"></div>
    </div>
    <div class="flex justify-between">
      <span>3 de 5 días completados</span>
      <span>60%</span>
    </div>
  </div>
  
  <div class="reward">
    Recompensa: <span>+50 XP</span>
  </div>
</div>
```

### Estructura Renderizada (Completado)
Mismo layout pero con:
- Badge verde con ✓ en lugar de ⚡
- Gradiente verde en la barra
- Texto verde

### Estructura Renderizada (Sin Desafío)
```html
<div class="text-center py-6">
  <i data-lucide="award"></i>
  <p>No hay desafío activo. ¡Crea uno nuevo!</p>
</div>
```

---

## 🔐 Autenticación

La función usa `apiGet()` que automáticamente:
1. Recupera el token: `localStorage.getItem('authToken')`
2. Construye headers: `Authorization: Token <token>`
3. Incluye `credentials: 'include'`

No requiere configuración manual.

---

## ⚙️ Comportamiento Idempotente

```typescript
// Seguro llamar múltiples veces
await loadWeeklyChallenge();
await loadWeeklyChallenge(); // ✅ No causa problemas
await loadWeeklyChallenge(); // ✅ OK

// Se reemplaza completamente el contenido cada vez
// Sin duplicaciones
```

---

## 🛡️ Manejo de Errores

### Caso: No hay desafío activo
```
Renderiza: "No hay desafío activo. ¡Crea uno nuevo!"
```

### Caso: Error de red/API
```
Renderiza: "Error al cargar el desafío semanal"
```

### Caso: Token inválido
```
Error: "Session expired. Please login again."
(Manejado globalmente por apiGet)
```

---

## 🎯 Colores y Estilos

### Estado: Activo
- Badge: Púrpura `bg-purple-500/20 text-purple-400`
- Barra: `from-purple-500 via-pink-500 to-purple-500`
- Ícono: ⚡ (zap)

### Estado: Completado
- Badge: Verde `bg-green-500/20 text-green-400`
- Barra: `from-green-500 via-emerald-500 to-green-500`
- Ícono: ✓ (check-circle)

### Tema: Oscuro
- Fondo: `bg-dark-card`
- Texto: `text-white` / `text-gray-500`
- Borde: `border-gray-800`

---

## 📱 Responsive

- Grid: `lg:col-span-2` (ocupa 2 columnas en desktop, 1 en mobile)
- Padding: `p-6` en todas las resoluciones
- Card: `rounded-3xl` con bordes redondeados

---

## 🔄 Integración con loadDashboard()

```typescript
async function loadDashboard() {
  // ... setup code ...
  
  // Carga paralela de datos
  await Promise.all([
    loadHabitsStats(),
    loadSubjectsStats(),
    loadPomodoroStats(),
    loadWeeklyObjectives(),
    loadWeeklyChallenge(),  // ← Se carga aquí
    loadWeeklyStudyRhythm(),
    loadFocusDistribution(),
    loadPeakProductivity(),
    loadKeyHabits(),
    loadNextEvent()
  ]);
  
  // ... cleanup code ...
}
```

**Ventaja:** No bloquea otras cargas, todo se carga en paralelo.

---

## 🧪 Testing en Console

```javascript
// 1. Verificar que apiGet funciona
const challenge = await apiGet("/weekly-challenge/active/");
console.log(challenge);

// 2. Forzar reload
await loadWeeklyChallenge();

// 3. Verificar elemento
console.log(document.querySelector('[data-challenge-container]').innerHTML);

// 4. Simular error
fetch('http://127.0.0.1:8000/api/weekly-challenge/active/', {
  headers: { 'Authorization': `Token ${localStorage.getItem('authToken')}` }
}).then(r => r.json()).then(console.log);
```

---

## 📋 Checklist de Requisitos

- ✅ GET a `/api/weekly-challenge/` con JWT (Bearer token)
- ✅ Backend garantiza que desafío existe y devuelve estado actual
- ✅ Respuesta incluye: title, description, current_value, target_value, progress_percentage, status
- ✅ Renderiza datos en sección HTML
- ✅ Actualiza progreso (barra + texto)
- ✅ Desafío completado muestra estado visual distinto
- ✅ Idempotente y segura para múltiples llamados
- ✅ Integrada en loadDashboard()

---

## 📚 Archivos Relacionados

| Archivo | Propósito |
|---------|-----------|
| `frontend/src/ts/dashboard.ts` | Función principal + lógica |
| `frontend/dashboard.html` | Estructura HTML + container |
| `backend/studyo/apps/weekly_challenges/serializers.py` | Datos de API |
| `backend/studyo/apps/weekly_challenges/models.py` | Lógica de modelo |
| `frontend/src/ts/api.ts` | Utilidades de API (apiGet) |

---

## 🔗 Enlaces Útiles

- **TypeScript Interface:** `WeeklyChallenge` (línea ~162)
- **Función Principal:** `loadWeeklyChallenge()` (línea ~826)
- **Función Auxiliar:** `renderWeeklyChallengeUI()` (línea ~876)
- **Container HTML:** `[data-challenge-container]` (dashboard.html línea ~346)

---

**Última actualización:** Feb 1, 2026
