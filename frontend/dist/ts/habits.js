var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiGet, apiPost, getToken } from './api.js';
// Icon configurations with colors
const ICON_CONFIGS = [
    { icon: 'zap', color: 'orange', name: 'Rayo' },
    { icon: 'book-open', color: 'green', name: 'Libro' },
    { icon: 'target', color: 'red', name: 'Objetivo' },
    { icon: 'coffee', color: 'blue', name: 'Café' },
    { icon: 'brain', color: 'purple', name: 'Cerebro' },
    { icon: 'clock', color: 'yellow', name: 'Reloj' },
    { icon: 'flame', color: 'orange', name: 'Llama' },
    { icon: 'trophy', color: 'gold', name: 'Trofeo' },
];
const COLOR_CLASSES = {
    orange: {
        card: 'bg-orange-950/40 border-orange-500/30 hover:bg-orange-900/40',
        text: 'text-orange-400',
        icon: 'text-orange-500',
        check: 'bg-orange-500 border-orange-500 text-black'
    },
    green: {
        card: 'bg-green-950/40 border-green-500/30 hover:bg-green-900/40',
        text: 'text-green-400',
        icon: 'text-green-500',
        check: 'bg-green-500 border-green-500 text-black'
    },
    red: {
        card: 'bg-red-950/40 border-red-500/30 hover:bg-red-900/40',
        text: 'text-red-400',
        icon: 'text-red-500',
        check: 'bg-red-500 border-red-500 text-white'
    },
    blue: {
        card: 'bg-blue-950/40 border-blue-500/30 hover:bg-blue-900/40',
        text: 'text-blue-400',
        icon: 'text-blue-500',
        check: 'bg-blue-500 border-blue-500 text-white'
    },
    purple: {
        card: 'bg-purple-950/40 border-purple-500/30 hover:bg-purple-900/40',
        text: 'text-purple-400',
        icon: 'text-purple-500',
        check: 'bg-purple-500 border-purple-500 text-white'
    },
    yellow: {
        card: 'bg-yellow-950/40 border-yellow-500/30 hover:bg-yellow-900/40',
        text: 'text-yellow-400',
        icon: 'text-yellow-500',
        check: 'bg-yellow-500 border-yellow-500 text-black'
    },
    gold: {
        card: 'bg-amber-950/40 border-amber-500/30 hover:bg-amber-900/40',
        text: 'text-amber-400',
        icon: 'text-amber-500',
        check: 'bg-amber-500 border-amber-500 text-black'
    }
};
function getTodayKey() {
    return new Date().toISOString().split('T')[0];
}
function getTodayCompletions() {
    const key = `habit_completions_${getTodayKey()}`;
    const stored = localStorage.getItem(key);
    return stored ? new Set(JSON.parse(stored)) : new Set();
}
function saveTodayCompletions(completions) {
    const key = `habit_completions_${getTodayKey()}`;
    localStorage.setItem(key, JSON.stringify([...completions]));
}
let todayCompletions = getTodayCompletions();
let habits = [];
let subjects = [];
let editingHabitId = null;
let selectedIcon = 'zap';
let selectedColor = 'orange';
/* ============================================================
   ✅ NUEVA FUNCIÓN QUE ACTUALIZA EXACTAMENTE EL PROGRESO
   ============================================================ */
function updateDailyProgress(completed, total) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const bar = document.getElementById("dailyProgressBar");
    const text = document.getElementById("dailyProgressText");
    if (bar) {
        bar.style.width = `${percent}%`;
        bar.setAttribute("data-progress", `${percent}`);
    }
    if (text) {
        text.textContent = `${percent}%`;
    }
}
function loadHabits() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const token = getToken();
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            todayCompletions = getTodayCompletions();
            const habitsData = yield apiGet('/habits/');
            habits = habitsData.map(h => {
                const completedToday = todayCompletions.has(h.id);
                const iconConfig = getIconForHabit(h);
                return Object.assign(Object.assign({}, h), { completedToday, icon: iconConfig.icon, color: iconConfig.color });
            });
            renderHabits();
            // 👇 actualización REAL del progreso
            updateDailyProgress(habits.filter(h => h.completedToday).length, habits.length);
        }
        catch (error) {
            console.error("Error loading habits:", error);
        }
    });
}
function loadSubjects() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            subjects = yield apiGet('/subjects/');
            const sel = document.getElementById('habitSubject');
            if (sel) {
                sel.innerHTML =
                    `<option value="">Ninguna</option>` +
                        subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }
        }
        catch (e) {
            console.error(e);
        }
    });
}
function getIconForHabit(habit) {
    const stored = localStorage.getItem(`habit_${habit.id}_icon`);
    if (stored)
        return JSON.parse(stored);
    const name = habit.name.toLowerCase();
    if (name.includes("estudiar") || name.includes("pomodoro"))
        return { icon: "zap", color: "orange" };
    if (name.includes("leer") || name.includes("repasar"))
        return { icon: "book-open", color: "green" };
    return { icon: "zap", color: "orange" };
}
function saveIconForHabit(habitId, icon, color) {
    localStorage.setItem(`habit_${habitId}_icon`, JSON.stringify({ icon, color }));
}
function renderHabits() {
    const grid = document.getElementById("habitsGrid");
    const emptyState = document.getElementById("emptyState"); // 1. Referencia al "coso" vacío
    if (!grid || !emptyState)
        return;
    // 2. Comprobamos si hay hábitos
    if (habits.length === 0) {
        // SI NO HAY HÁBITOS:
        grid.innerHTML = ""; // Limpiamos la grilla por si acaso
        grid.classList.add("hidden"); // Ocultamos la grilla
        emptyState.classList.remove("hidden"); // Mostramos el estado vacío
        emptyState.classList.add("flex"); // Aseguramos que se vea bien (flexbox)
        return;
    }
    // SI SÍ HAY HÁBITOS:
    emptyState.classList.add("hidden"); // Ocultamos el estado vacío
    emptyState.classList.remove("flex");
    grid.classList.remove("hidden"); // Mostramos la grilla
    // 3. Renderizamos las tarjetas (tu código original)
    grid.innerHTML = habits.map(habit => {
        const color = COLOR_CLASSES[habit.color] || COLOR_CLASSES.orange;
        const completed = habit.completedToday;
        return `
        <div class="relative group rounded-2xl p-6 border transition-all duration-300 ${color.card}">
            <div class="flex items-start gap-4">
                <div class="flex-1 min-w-0 pr-10">
                    <div class="flex items-center gap-3 mb-2">
                        <i data-lucide="${habit.icon}" class="w-6 h-6 ${completed ? "text-gray-600" : color.icon}"></i>
                        <h3 class="font-bold text-lg truncate ${completed ? "line-through text-gray-500" : "text-white"}">
                            ${habit.name}
                        </h3>
                    </div>
                    <div class="flex items-center gap-2 text-sm font-medium ${completed ? "text-gray-600" : color.text}">
                        <i data-lucide="trending-up" class="w-4 h-4"></i>
                        <span>Racha: ${habit.streak}</span>
                    </div>
                </div>
            </div>

            <button 
                class="habit-complete-btn absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                data-habit-id="${habit.id}" 
                data-completed="${completed}">
                ${completed ? `<i data-lucide="check" class="w-4 h-4"></i>` : ""}
            </button>
        </div>`;
    }).join("");
    lucide.createIcons();
    attachHabitEventListeners();
}
function handleSaveHabit(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault(); // Evita que la página se recargue
        const submitBtn = document.querySelector('#habitForm button[type="submit"]');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = "Guardando...";
        submitBtn.disabled = true;
        try {
            const form = e.target;
            const formData = new FormData(form);
            const name = formData.get('name');
            const frequency = parseInt(formData.get('frequency'));
            const subjectValue = formData.get('subject');
            const subject = subjectValue ? parseInt(subjectValue) : null;
            const payload = {
                name,
                frequency,
                subject
            };
            // Enviamos a la API
            const newHabit = yield apiPost('/habits/', payload, true);
            // Guardamos la preferencia de icono/color localmente (ya que tu backend parece no guardarlo)
            saveIconForHabit(newHabit.id, selectedIcon, selectedColor);
            // Limpiamos y recargamos
            closeCreateModal();
            loadHabits(); // Recarga la lista para ver el nuevo hábito
            // Opcional: Mostrar mensaje de éxito
            // alert("Hábito creado con éxito");
        }
        catch (error) {
            console.error("Error al guardar hábito:", error);
            alert("Hubo un error al crear el hábito. Revisa la consola.");
        }
        finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}
function attachHabitEventListeners() {
    document.querySelectorAll('.habit-complete-btn').forEach(button => {
        button.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            const btn = e.currentTarget;
            const id = Number(btn.dataset.habitId);
            const completed = btn.dataset.completed === "true";
            yield toggleHabitCompletion(id, !completed);
        }));
    });
}
function toggleHabitCompletion(habitId, complete) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token)
            return;
        const index = habits.findIndex(h => h.id === habitId);
        if (index === -1)
            return;
        const previousState = habits[index].completedToday;
        const previousStreak = habits[index].streak;
        try {
            habits[index].completedToday = complete;
            habits[index].streak = complete
                ? previousStreak + 1
                : Math.max(0, previousStreak - 1);
            if (complete)
                todayCompletions.add(habitId);
            else
                todayCompletions.delete(habitId);
            saveTodayCompletions(todayCompletions);
            // 👇 progreso actualizado al instante
            updateDailyProgress(habits.filter(h => h.completedToday).length, habits.length);
            renderHabits();
            const response = yield fetch(`http://127.0.0.1:8000/api/habits/${habitId}/complete/`, {
                method: complete ? "POST" : "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                }
            });
            if (!response.ok)
                throw new Error("Error API");
        }
        catch (err) {
            habits[index].completedToday = previousState;
            habits[index].streak = previousStreak;
            alert("Error de conexión. No se guardó.");
            // revertir
            renderHabits();
            updateDailyProgress(habits.filter(h => h.completedToday).length, habits.length);
        }
    });
}
window.addEventListener("DOMContentLoaded", () => {
    loadSubjects();
    loadHabits();
    attachGlobalListeners();
});
function attachGlobalListeners() {
    // ... (Tus constantes de botones existentes: createBtn, emptyStateBtn, etc.) ...
    const createBtn = document.getElementById('addHabitBtn');
    const emptyStateBtn = document.getElementById('emptyStateAddBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    // 👇 AGREGA ESTO: Referencia al formulario
    const habitForm = document.getElementById('habitForm');
    // Listeners existentes...
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            prepareCreateModal();
            openCreateModal();
        });
    }
    if (emptyStateBtn) {
        emptyStateBtn.addEventListener('click', () => {
            prepareCreateModal();
            openCreateModal();
        });
    }
    if (cancelBtn)
        cancelBtn.addEventListener('click', closeCreateModal);
    if (closeModalBtn)
        closeModalBtn.addEventListener('click', closeCreateModal);
    // 👇 AGREGA ESTO: El listener del submit
    if (habitForm) {
        // Primero removemos listeners anteriores para evitar duplicados si esta función se llama varias veces
        habitForm.removeEventListener('submit', handleSaveHabit);
        habitForm.addEventListener('submit', handleSaveHabit);
    }
}
// Función auxiliar para resetear el formulario antes de abrir
function prepareCreateModal() {
    editingHabitId = null;
    selectedIcon = 'zap';
    selectedColor = 'orange';
    const form = document.getElementById('habitForm');
    if (form)
        form.reset();
    // Aquí deberías llamar a una función que renderice los iconos si no lo has hecho
    renderIconsSelection();
}
function openCreateModal() {
    const modal = document.getElementById('habitModal');
    if (modal) {
        // CORRECCIÓN: Usamos 'active' porque tu CSS define .modal-overlay.active { display: flex }
        modal.classList.add('active');
        // Animación de entrada
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.remove('animate-fade-out');
            content.classList.add('animate-fade-in');
        }
    }
}
function closeCreateModal() {
    const modal = document.getElementById('habitModal');
    if (modal) {
        // CORRECCIÓN: Quitamos la clase 'active' para ocultarlo según tu CSS
        modal.classList.remove('active');
    }
}
// Función extra para renderizar los iconos en el modal (que faltaba en tu TS)
function renderIconsSelection() {
    const container = document.querySelector('#habitForm .grid');
    if (!container)
        return;
    container.innerHTML = ICON_CONFIGS.map(config => `
        <div class="icon-option cursor-pointer p-3 rounded-xl border border-gray-700 bg-dark-input hover:border-${config.color}-500 flex items-center justify-center transition-all ${selectedIcon === config.icon ? `border-${config.color}-500 bg-${config.color}-500/10 ring-2 ring-${config.color}-500/50` : ''}"
             onclick="selectIcon('${config.icon}', '${config.color}')">
            <i data-lucide="${config.icon}" class="w-6 h-6 text-${config.color}-500"></i>
        </div>
    `).join('');
    // Necesario porque lucide se carga via CDN global
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
    // Exponemos la función de selección al window para que el string HTML funcione
    window.selectIcon = (icon, color) => {
        selectedIcon = icon;
        selectedColor = color;
        renderIconsSelection(); // Re-render para mostrar la selección visual
    };
}
