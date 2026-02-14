import { apiGet, apiPost, apiPut, apiDelete, getToken, getCurrentUser, BASE_URL } from './api.js';
import { initConfirmModal, showConfirmModal } from "./confirmModal.js";
import { translations, getCurrentLanguage } from './i18n.js';
import { getOnboardingContext, showOnboardingOverlay, hideOnboardingOverlay, skipOnboarding, hydrateOnboardingContext, syncOnboardingAcrossTabs, onHabitCreated } from './onboarding.js';


/**
 * Declare lucide icons library as global (loaded via CDN)
 */
declare const lucide: {
    createIcons: () => void;
};

/**
 * Interfaces
 */
interface Habit {
    id: number;
    name: string;
    frequency: number;
    streak: number;
    subject: number | null;
    completed_today?: boolean;
    is_key?: boolean;
    created_at?: string;
}

interface Subject {
    id: number;
    name: string;
}

interface HabitWithStatus extends Habit {
    completedToday: boolean;
    icon: string;
    color: string;
}

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

const COLOR_CLASSES: { [key: string]: { card: string; text: string; icon: string; check: string } } = {
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
    return getCurrentLanguage() as keyof typeof translations;
}

function getT() {
    const lang = getLang();
    return translations[lang];
}

/**
 * Devuelve un objeto con "hoy" y "mañana" en timezone del usuario
 */
function getUserToday(userTimezone: string) {
    // Obtenemos la hora actual en la timezone del usuario
    const nowStr = new Date().toLocaleString('en-US', { timeZone: userTimezone });
    const now = new Date(nowStr); // ahora "now" está ajustado a la timezone del usuario

    // Obtenemos la fecha YYYY-MM-DD
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    const todayKey = `${year}-${month}-${day}`;

    return { now, todayKey };
}


function getTodayCompletions(userTimezone: string): Set<number> {
    const { todayKey } = getUserToday(userTimezone);
    const currentKey = `habit_completions_${todayKey}`;

    // Limpiamos keys anteriores
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('habit_completions_') && key !== currentKey) {
            localStorage.removeItem(key);
        }
    }

    const stored = localStorage.getItem(currentKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
}

function saveTodayCompletions(completions: Set<number>, userTimezone: string) {
    const { todayKey } = getUserToday(userTimezone);
    const key = `habit_completions_${todayKey}`;
    localStorage.setItem(key, JSON.stringify([...completions]));
}


// Global state variables
let habits: HabitWithStatus[] = [];
let subjects: Subject[] = [];
let editingHabitId: number | null = null;
let selectedIcon = 'zap';
let selectedColor = 'orange';
let userTimezone = 'UTC';
let todayCompletions: Set<number> = new Set(); // inicial vacío


function updateDailyProgress(completed: number, total: number) {
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

async function loadHabits() {
    try {
        const token = getToken();
        if (!token) {
            window.location.href = '/login';
            return;
        }
        // Obtenemos timezone del usuario
        const currentUser = await getCurrentUser();
        userTimezone = currentUser.timezone ?? 'UTC';

        // Inicializamos todayCompletions con el timezone correcto
        todayCompletions = getTodayCompletions(userTimezone);

        const habitsData: Habit[] = await apiGet('/habits/');

        habits = habitsData.map(h => {
            const serverSaysCompleted = h.completed_today || false;
            if (serverSaysCompleted) todayCompletions.add(h.id);
            else todayCompletions.delete(h.id);

            const iconConfig = getIconForHabit(h);
            return {
                ...h,
                completedToday: serverSaysCompleted,
                icon: iconConfig.icon,
                color: iconConfig.color
            };
        });

        saveTodayCompletions(todayCompletions, userTimezone);
        renderHabits();
        updateDailyProgress(habits.filter(h => h.completedToday).length, habits.length);
        applyOnboardingOnHabitsPage();
    } catch (error) {
        console.error("Error loading habits:", error);
    }
}


async function loadSubjects() {
    try {
        const t = getT();
        subjects = await apiGet('/subjects/');
        const sel = document.getElementById('habitSubject') as HTMLSelectElement;
        if (sel) {
            // "Ninguna" translated to "None" or equivalent
            sel.innerHTML = `<option value="">${t.subjects.notSpecified}</option>` +
                subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

function getIconForHabit(habit: Habit) {
    const stored = localStorage.getItem(`habit_${habit.id}_icon`);
    if (stored) return JSON.parse(stored);
    const name = habit.name.toLowerCase();
    if (name.includes("estudiar") || name.includes("pomodoro")) return { icon: "zap", color: "orange" };
    if (name.includes("leer") || name.includes("repasar")) return { icon: "book-open", color: "green" };
    return { icon: "zap", color: "orange" };
}

function saveIconForHabit(habitId: number, icon: string, color: string) {
    localStorage.setItem(`habit_${habitId}_icon`, JSON.stringify({ icon, color }));
}

function renderHabits() {
    const grid = document.getElementById("habitsGrid");
    const emptyState = document.getElementById("emptyState");
    if (!grid || !emptyState) return;

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
        if (emptyTitle) emptyTitle.textContent = t.habits.emptyTitle;
        if (emptyDesc) emptyDesc.textContent = t.habits.emptyDesc;
        if (emptyBtn) {
            const span = emptyBtn.querySelector('span');
            if (span) span.textContent = t.habits.createFirst;
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

    if (typeof lucide !== 'undefined') lucide.createIcons();
    attachHabitEventListeners();
}

/**
 * ACTIONS: Edit & Delete
 */

function openEditModal(habitId: number) {
    const t = getT();
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    editingHabitId = habitId;
    selectedIcon = habit.icon;
    selectedColor = habit.color;

    const nameInput = document.getElementById('habitName') as HTMLInputElement;
    const freqSelect = document.getElementById('habitFrequency') as HTMLSelectElement;
    const subjSelect = document.getElementById('habitSubject') as HTMLSelectElement;
    const keyCheck = document.getElementById('habitIsKey') as HTMLInputElement;

    if (nameInput) nameInput.value = habit.name;
    if (freqSelect) freqSelect.value = String(habit.frequency);
    if (subjSelect) subjSelect.value = habit.subject ? String(habit.subject) : "";
    if (keyCheck) keyCheck.checked = !!habit.is_key;

    const title = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    
    if (title) title.textContent = t.habits.editHabit;
    if (submitBtnText) submitBtnText.textContent = t.common.save;

    renderIconsSelection();
    openCreateModal();
}

async function deleteHabit(habitId: number) {
    const translations = getT();
    const confirmed = await showConfirmModal(
        translations.confirmations.deleteHabitMessage,
        translations.confirmations.deleteHabitTitle
    );
    if (!confirmed) return;

    try {
        await apiDelete(`/habits/${habitId}/`);
        localStorage.removeItem(`habit_${habitId}_icon`);
        loadHabits(); 
    } catch (error) {
        console.error("Error deleting habit:", error);
    }
}

async function handleSaveHabit(e: Event) {
    e.preventDefault();
    const t = getT();

    const submitBtn = document.querySelector('#habitForm button[type="submit"]') as HTMLButtonElement;
    const submitTextSpan = document.getElementById('submitBtnText');
    const originalText = submitTextSpan ? submitTextSpan.innerText : "Guardar";
    
    if(submitTextSpan) submitTextSpan.innerText = t.common.loading;
    submitBtn.disabled = true;

    try {
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const name = formData.get('name') as string;
        const frequency = parseInt(formData.get('frequency') as string);
        const subjectValue = formData.get('subject') as string;
        const subject = subjectValue ? parseInt(subjectValue) : null;
        const isKey = formData.get('is_key') === 'on' || formData.get('is_key') === 'true';

        const payload = { name, frequency, subject, is_key: isKey };

        if (editingHabitId) {
            await apiPut(`/habits/${editingHabitId}/`, payload);
            saveIconForHabit(editingHabitId, selectedIcon, selectedColor);
        } else {
            const newHabit = await apiPost('/habits/', payload, true);
            saveIconForHabit(newHabit.id, selectedIcon, selectedColor);
        }

        closeCreateModal();

        const ctx = getOnboardingContext();
        if (ctx && ctx.active && ctx.step === 'CREATE_HABIT') {
            await loadHabits();
            try { await onHabitCreated(); } catch (e) { console.warn('onboarding transition failed', e); }
            return;
        }

        loadHabits();
    } catch (error) {
        console.error("Error saving habit:", error);
    } finally {
        if(submitTextSpan) submitTextSpan.innerText = originalText;
        submitBtn.disabled = false;
    }
}

function attachHabitEventListeners() {
    document.querySelectorAll('.habit-complete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            const id = Number(btn.dataset.habitId);
            const completed = btn.dataset.completed === "true";
            await toggleHabitCompletion(id, !completed);
        });
    });

    document.querySelectorAll('.edit-habit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            const id = Number(btn.dataset.habitId);
            openEditModal(id);
        });
    });

    document.querySelectorAll('.delete-habit-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const btn = e.currentTarget as HTMLButtonElement;
            const id = Number(btn.dataset.habitId);
            deleteHabit(id);
        });
    });
}

async function toggleHabitCompletion(habitId: number, complete: boolean) {
    const token = getToken();
    if (!token) return;

    const index = habits.findIndex(h => h.id === habitId);
    if (index === -1) return;

    const previousState = habits[index].completedToday;
    const previousStreak = habits[index].streak;

    try {
        habits[index].completedToday = complete;
        if (complete) todayCompletions.add(habitId);
        else todayCompletions.delete(habitId);

        saveTodayCompletions(todayCompletions, userTimezone);
        updateDailyProgress(habits.filter(h => h.completedToday).length, habits.length);
        renderHabits();

        const response = await fetch(
            `${BASE_URL}/habits/${habitId}/complete/`,
            {
                method: complete ? "POST" : "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                }
            }
        );

        if (!response.ok) throw new Error("Error API");
        const data = await response.json();
        if (data.streak !== undefined) {
            habits[index].streak = data.streak;
            renderHabits();
            // Notify dashboard to reload weekly challenge (debounced listener will handle duplicate calls)
            try { document.dispatchEvent(new CustomEvent('weeklyChallenge:update')); } catch (e) {}
        }
    } catch (err) {
        habits[index].completedToday = previousState;
        habits[index].streak = previousStreak;
        renderHabits();
        updateDailyProgress(habits.filter(h => h.completedToday).length, habits.length);
        applyOnboardingOnHabitsPage();
    }
}


function applyOnboardingOnHabitsPage(): void {
    const ctx = getOnboardingContext();
    if (!ctx || !ctx.active || ctx.step !== 'CREATE_HABIT') {
        hideOnboardingOverlay();
        return;
    }

    const keyCheckbox = document.getElementById('habitIsKey') as HTMLInputElement | null;
    const keyHint = document.getElementById('onboardingHabitKeyHint');

    if (keyCheckbox) keyCheckbox.classList.add('onboarding-highlight');
    if (keyHint) keyHint.classList.remove('hidden');

    const copy = getT();
    showOnboardingOverlay({
        title: (copy as any).onboarding?.stepCreateHabitTitle || 'Paso 2: Creá un hábito',
        body: (copy as any).onboarding?.stepCreateHabitBody || 'Creá un hábito y revisá “Hábito clave”.',
        primaryText: (copy as any).onboarding?.createHabit || 'Crear hábito',
        lockClose: true,
        allowSkip: true,
        onSkip: async () => {
            try { await skipOnboarding(); } catch (_) {}
            hideOnboardingOverlay();
        },
        onPrimary: () => {
            prepareCreateModal();
            openCreateModal();
        },
    });
}

window.addEventListener("DOMContentLoaded", async () => {
    await hydrateOnboardingContext();
    syncOnboardingAcrossTabs(() => applyOnboardingOnHabitsPage());
    loadSubjects();
    loadHabits();
    attachGlobalListeners();
});

function attachGlobalListeners(): void {
    const createBtn = document.getElementById('addHabitBtn') as HTMLButtonElement | null;
    const emptyStateBtn = document.getElementById('emptyStateAddBtn') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement | null;
    const closeModalBtn = document.getElementById('closeModalBtn') as HTMLButtonElement | null;
    const habitForm = document.getElementById('habitForm') as HTMLFormElement | null;

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

    if (cancelBtn) cancelBtn.addEventListener('click', closeCreateModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeCreateModal);

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

    const form = document.getElementById('habitForm') as HTMLFormElement | null;
    if (form) form.reset();

    const title = document.getElementById('modalTitle');
    const submitBtnText = document.getElementById('submitBtnText');
    if (title) title.textContent = t.habits.addHabit;
    if (submitBtnText) submitBtnText.textContent = t.habits.createHabit;

    renderIconsSelection();
}

function openCreateModal(): void {
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

function closeCreateModal(): void {
    const modal = document.getElementById('habitModal');
    if (modal) modal.classList.remove('active');
}

function renderIconsSelection() {
    const container = document.querySelector('#habitForm .grid');
    if (!container) return;

    container.innerHTML = ICON_CONFIGS.map(config => `
        <div class="icon-option cursor-pointer p-3 rounded-xl border border-gray-700 bg-dark-input hover:border-${config.color}-500 flex items-center justify-center transition-all ${selectedIcon === config.icon ? `border-${config.color}-500 bg-${config.color}-500/10 ring-2 ring-${config.color}-500/50` : ''}"
             onclick="selectIcon('${config.icon}', '${config.color}')">
            <i data-lucide="${config.icon}" class="w-6 h-6 text-${config.color}-500"></i>
        </div>
    `).join('');

    if (typeof lucide !== 'undefined') lucide.createIcons();

    (window as any).selectIcon = (icon: string, color: string) => {
        selectedIcon = icon;
        selectedColor = color;
        renderIconsSelection();
    };
}

