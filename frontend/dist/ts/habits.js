var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiGet, apiPost, apiPut, apiDelete, getToken, getCurrentUser } from './api.js';
import { showConfirmModal } from "./confirmModal.js";
import { translations, getCurrentLanguage } from './i18n.js';
/**
 * Constants & Config
 */
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
    orange: { card: 'bg-orange-950/40 border-orange-500/30 hover:bg-orange-900/40', text: 'text-orange-400', icon: 'text-orange-500', check: 'bg-orange-500 border-orange-500 text-black' },
    green: { card: 'bg-green-950/40 border-green-500/30 hover:bg-green-900/40', text: 'text-green-400', icon: 'text-green-500', check: 'bg-green-500 border-green-500 text-black' },
    red: { card: 'bg-red-950/40 border-red-500/30 hover:bg-red-900/40', text: 'text-red-400', icon: 'text-red-500', check: 'bg-red-500 border-red-500 text-white' },
    blue: { card: 'bg-blue-950/40 border-blue-500/30 hover:bg-blue-900/40', text: 'text-blue-400', icon: 'text-blue-500', check: 'bg-blue-500 border-blue-500 text-white' },
    purple: { card: 'bg-purple-950/40 border-purple-500/30 hover:bg-purple-900/40', text: 'text-purple-400', icon: 'text-purple-500', check: 'bg-purple-500 border-purple-500 text-white' },
    yellow: { card: 'bg-yellow-950/40 border-yellow-500/30 hover:bg-yellow-900/40', text: 'text-yellow-400', icon: 'text-yellow-500', check: 'bg-yellow-500 border-yellow-500 text-black' },
    gold: { card: 'bg-amber-950/40 border-amber-500/30 hover:bg-amber-900/40', text: 'text-amber-400', icon: 'text-amber-500', check: 'bg-amber-500 border-amber-500 text-black' }
};
/**
 * i18n Helpers
 */
function getLang() {
    return getCurrentLanguage();
}
function getT() {
    const lang = getLang();
    return translations[lang];
}
/**
 * Local Storage Helpers
 */
function getTodayKey(userTimezone) {
    const now = new Date();
    const options = {
        timeZone: userTimezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    return now.toLocaleDateString('en-CA', options); // YYYY-MM-DD
}
function getTodayCompletions(userTimezone) {
    const currentKey = `habit_completions_${getTodayKey(userTimezone)}`;
    // Limpia las keys de días anteriores
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('habit_completions_') && key !== currentKey) {
            localStorage.removeItem(key);
        }
    }
    const stored = localStorage.getItem(currentKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
}
function saveTodayCompletions(completions, userTimezone) {
    const key = `habit_completions_${getTodayKey(userTimezone)}`;
    localStorage.setItem(key, JSON.stringify([...completions]));
}
// Global state variables
let habits = [];
let subjects = [];
let editingHabitId = null;
let selectedIcon = 'zap';
let selectedColor = 'orange';
let userTimezone = 'UTC';
let todayCompletions = new Set(); // inicial vacío
function updateDailyProgress(completed, total) {
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    const t = getT();
    const progressTextEl = document.getElementById("progressText");
    if (progressTextEl) {
        const template = t.habits.progressText || 'Completaste {percent}% de tus hábitos hoy.';
        const percentSpan = `<span id="progressPercentage" class="text-purple-400 font-bold">${percent}%</span>`;
        progressTextEl.innerHTML = template.replace('{percent}', percentSpan);
    }
    const bar = document.getElementById("dailyProgressBar");
    if (bar) {
        bar.style.width = `${percent}%`;
        bar.setAttribute("data-progress", `${percent}`);
    }
}
function loadHabits() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const token = getToken();
            if (!token) {
                window.location.href = 'login.html';
                return;
            }
            // Obtenemos timezone del usuario
            const currentUser = yield getCurrentUser();
            userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            // Inicializamos todayCompletions con el timezone correcto
            todayCompletions = getTodayCompletions(userTimezone);
            const habitsData = yield apiGet('/habits/');
            habits = habitsData.map(h => {
                const serverSaysCompleted = h.completed_today || false;
                if (serverSaysCompleted)
                    todayCompletions.add(h.id);
                else
                    todayCompletions.delete(h.id);
                const iconConfig = getIconForHabit(h);
                return Object.assign(Object.assign({}, h), { completedToday: serverSaysCompleted, icon: iconConfig.icon, color: iconConfig.color });
            });
            saveTodayCompletions(todayCompletions, userTimezone);
            renderHabits();
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
            const t = getT();
            subjects = yield apiGet('/subjects/');
            const sel = document.getElementById('habitSubject');
            if (sel) {
                // "Ninguna" translated to "None" or equivalent
                sel.innerHTML = `<option value="">${t.subjects.notSpecified}</option>` +
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
    const emptyState = document.getElementById("emptyState");
    if (!grid || !emptyState)
        return;
    const t = getT();
    const lang = getLang();
    if (habits.length === 0) {
        grid.innerHTML = "";
        grid.classList.add("hidden");
        emptyState.classList.remove("hidden");
        emptyState.classList.add("flex");
        // Update Empty State Texts
        const emptyTitle = emptyState.querySelector('h3');
        const emptyDesc = emptyState.querySelector('p');
        const emptyBtn = document.getElementById('emptyStateAddBtn');
        if (emptyTitle)
            emptyTitle.textContent = t.habits.emptyTitle;
        if (emptyDesc)
            emptyDesc.textContent = t.habits.emptyDesc;
        if (emptyBtn) {
            const span = emptyBtn.querySelector('span');
            if (span)
                span.textContent = t.habits.createFirst;
        }
        updateDailyProgress(0, 0);
        return;
    }
    emptyState.classList.add("hidden");
    emptyState.classList.remove("flex");
    grid.classList.remove("hidden");
    // Streak Label Localization
    const streakLabel = t.habits.streak;
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
                        <span>${streakLabel}: ${habit.streak}</span>
                    </div>
                </div>
            </div>

            <button 
                class="habit-complete-btn absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                data-habit-id="${habit.id}" 
                data-completed="${completed}">
                ${completed ? `<i data-lucide="check" class="w-4 h-4"></i>` : ""}
            </button>

            <div class="flex gap-3 pt-4 border-t border-gray-700/50">
                <button title="${t.habits.editHabit}" class="edit-habit-btn flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-habit-id="${habit.id}">
                    <i data-lucide="edit-2" class="w-4 h-4"></i>
                </button>
                <button title="${t.common.delete}" class="delete-habit-btn flex-1 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-habit-id="${habit.id}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        </div>`;
    }).join("");
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
    attachHabitEventListeners();
}
/**
 * ACTIONS: Edit & Delete
 */
function openEditModal(habitId) {
    const t = getT();
    const habit = habits.find(h => h.id === habitId);
    if (!habit)
        return;
    editingHabitId = habitId;
    selectedIcon = habit.icon;
    selectedColor = habit.color;
    const nameInput = document.getElementById('habitName');
    const freqSelect = document.getElementById('habitFrequency');
    const subjSelect = document.getElementById('habitSubject');
    const keyCheck = document.getElementById('habitIsKey');
    if (nameInput)
        nameInput.value = habit.name;
    if (freqSelect)
        freqSelect.value = String(habit.frequency);
    if (subjSelect)
        subjSelect.value = habit.subject ? String(habit.subject) : "";
    if (keyCheck)
        keyCheck.checked = !!habit.is_key;
    const title = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    if (title)
        title.textContent = t.habits.editHabit;
    if (submitBtnText)
        submitBtnText.textContent = t.common.save;
    renderIconsSelection();
    openCreateModal();
}
function deleteHabit(habitId) {
    return __awaiter(this, void 0, void 0, function* () {
        const translations = getT();
        const confirmed = yield showConfirmModal(translations.confirmations.deleteHabitMessage, translations.confirmations.deleteHabitTitle);
        if (!confirmed)
            return;
        try {
            yield apiDelete(`/habits/${habitId}/`);
            localStorage.removeItem(`habit_${habitId}_icon`);
            loadHabits();
        }
        catch (error) {
            console.error("Error deleting habit:", error);
        }
    });
}
function handleSaveHabit(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const t = getT();
        const submitBtn = document.querySelector('#habitForm button[type="submit"]');
        const submitTextSpan = document.getElementById('submitBtnText');
        const originalText = submitTextSpan ? submitTextSpan.innerText : "Guardar";
        if (submitTextSpan)
            submitTextSpan.innerText = t.common.loading;
        submitBtn.disabled = true;
        try {
            const form = e.target;
            const formData = new FormData(form);
            const name = formData.get('name');
            const frequency = parseInt(formData.get('frequency'));
            const subjectValue = formData.get('subject');
            const subject = subjectValue ? parseInt(subjectValue) : null;
            const isKey = formData.get('is_key') === 'on' || formData.get('is_key') === 'true';
            const payload = { name, frequency, subject, is_key: isKey };
            if (editingHabitId) {
                yield apiPut(`/habits/${editingHabitId}/`, payload);
                saveIconForHabit(editingHabitId, selectedIcon, selectedColor);
            }
            else {
                const newHabit = yield apiPost('/habits/', payload, true);
                saveIconForHabit(newHabit.id, selectedIcon, selectedColor);
            }
            closeCreateModal();
            loadHabits();
        }
        catch (error) {
            console.error("Error saving habit:", error);
        }
        finally {
            if (submitTextSpan)
                submitTextSpan.innerText = originalText;
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
    document.querySelectorAll('.edit-habit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const id = Number(btn.dataset.habitId);
            openEditModal(id);
        });
    });
    document.querySelectorAll('.delete-habit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const id = Number(btn.dataset.habitId);
            deleteHabit(id);
        });
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
            if (complete)
                todayCompletions.add(habitId);
            else
                todayCompletions.delete(habitId);
            saveTodayCompletions(todayCompletions, userTimezone);
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
            const data = yield response.json();
            if (data.streak !== undefined) {
                habits[index].streak = data.streak;
                renderHabits();
            }
        }
        catch (err) {
            habits[index].completedToday = previousState;
            habits[index].streak = previousStreak;
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
    const createBtn = document.getElementById('addHabitBtn');
    const emptyStateBtn = document.getElementById('emptyStateAddBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const habitForm = document.getElementById('habitForm');
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
    if (habitForm) {
        habitForm.removeEventListener('submit', handleSaveHabit);
        habitForm.addEventListener('submit', handleSaveHabit);
    }
}
function prepareCreateModal() {
    const t = getT();
    editingHabitId = null;
    selectedIcon = 'zap';
    selectedColor = 'orange';
    const form = document.getElementById('habitForm');
    if (form)
        form.reset();
    const title = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    if (title)
        title.textContent = t.habits.addHabit;
    if (submitBtnText)
        submitBtnText.textContent = t.habits.createHabit;
    renderIconsSelection();
}
function openCreateModal() {
    const modal = document.getElementById('habitModal');
    if (modal) {
        modal.classList.add('active');
        const content = modal.querySelector('.modal-content');
        if (content) {
            content.classList.remove('animate-fade-out');
            content.classList.add('animate-fade-in');
        }
    }
}
function closeCreateModal() {
    const modal = document.getElementById('habitModal');
    if (modal)
        modal.classList.remove('active');
}
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
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
    window.selectIcon = (icon, color) => {
        selectedIcon = icon;
        selectedColor = color;
        renderIconsSelection();
    };
}
