var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Import API functions for making HTTP requests and token management
import { apiGet, apiPost, apiDelete, apiPut, apiPatch, getToken, getEvents, getCurrentUser } from "./api.js";
import { initConfirmModal, showConfirmModal, showAlertModal } from "./confirmModal.js";
import { t, getCurrentLanguage, setCurrentLanguage, applyTranslations } from "./i18n.js";
// --- Concentration Mode Setup (global) ---
function setupConcentrationMode() {
    function enter() {
        document.body.classList.add('concentration-mode');
        // Close pomodoro settings modal if it's open
        const settingsModal = document.getElementById('pomodoroSettingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
        try {
            const el = document.documentElement;
            if (el.requestFullscreen)
                el.requestFullscreen().catch(() => { });
        }
        catch (e) { }
    }
    function exit() {
        var _a, _b;
        document.body.classList.remove('concentration-mode');
        try {
            if (document.fullscreenElement)
                document.exitFullscreen();
        }
        catch (e) { }
        // Hide enter toast first if it's still visible
        try {
            (_b = (_a = window).hideEnterToast) === null || _b === void 0 ? void 0 : _b.call(_a);
        }
        catch (e) { }
        // Close pomodoro settings modal if it's open
        const settingsModal = document.getElementById('pomodoroSettingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
        // Show exit toast after a short delay
        setTimeout(() => {
            var _a, _b;
            try {
                (_b = (_a = window).showExitToast) === null || _b === void 0 ? void 0 : _b.call(_a);
            }
            catch (e) { }
        }, 120);
    }
    const toggle = document.getElementById('concentrationToggleBtn');
    const exitBtn = document.getElementById('concentrationExitBtn');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            var _a, _b;
            e.preventDefault();
            if (!document.body.classList.contains('concentration-mode')) {
                enter();
                // show enter toast once
                try {
                    (_b = (_a = window).showEnterToast) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
                catch (e) { }
            }
            else
                exit();
        });
    }
    if (exitBtn) {
        exitBtn.addEventListener('click', (e) => { e.preventDefault(); exit(); });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && document.body.classList.contains('concentration-mode')) {
            exit();
        }
    });
    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && document.body.classList.contains('concentration-mode')) {
            exit();
        }
    });
}
function localizeConcentrationToasts() {
    const trans = t();
    const enterToast = document.getElementById('concentrationEnterToast');
    if (enterToast) {
        const title = enterToast.querySelector('.title');
        if (title)
            title.textContent = trans.dashboard.concentrationEnterTitle;
        const body = title === null || title === void 0 ? void 0 : title.nextElementSibling;
        if (body)
            body.textContent = trans.dashboard.concentrationEnterBody;
        const close = enterToast.querySelector('.close-x');
        if (close)
            close.setAttribute('title', trans.common.close);
    }
    const exitToast = document.getElementById('concentrationExitToast');
    if (exitToast) {
        const title = exitToast.querySelector('.title');
        if (title)
            title.textContent = trans.dashboard.concentrationExitTitle;
        const body = title === null || title === void 0 ? void 0 : title.nextElementSibling;
        if (body)
            body.textContent = trans.dashboard.concentrationExitBody;
        const close = exitToast.querySelector('.close-x');
        if (close)
            close.setAttribute('title', trans.common.close);
    }
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupConcentrationMode);
}
else {
    setupConcentrationMode();
}
/**
 * ==========================================
 * Utility Functions
 * ==========================================
 * Helper functions for date formatting, priority management, and data processing
 */
/**
 * Formats a date string into Spanish relative format
 * @param dateString - ISO date string to format
 * @returns Formatted date string (e.g., "Pasado", "Hoy", "Mañana", "En 5 días")
 */
function formatDate(dateString) {
    if (!dateString)
        return "No programado"; // Return default text if no date provided
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0)
        return "Pasado";
    if (diffDays === 0)
        return "Hoy";
    if (diffDays === 1)
        return "Mañana";
    if (diffDays <= 7)
        return `En ${diffDays} días`;
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}
/**
 * Gets human-readable priority level name
 * @param priority - Priority numeric level (1-3)
 * @returns Priority name in Spanish
 */
function getPriorityName(priority) {
    if (!priority)
        return "Sin prioridad"; // Default text when no priority assigned
    const priorities = {
        1: "Alta", // High priority
        2: "Media", // Medium priority
        3: "Baja" // Low priority
    };
    return priorities[priority] || "Sin prioridad";
}
/**
 * Gets color associated with priority level for UI visualization
 * @param priority - Priority numeric level (1-3)
 * @returns Hex color code for the priority
 */
function getPriorityColor(priority) {
    if (!priority)
        return "#71717a"; // Default gray color when no priority set
    const colors = {
        1: "#ef4444", // Red for high priority
        2: "#f59e0b", // Yellow for medium priority
        3: "#10b981" // Green for low priority
    };
    return colors[priority] || "#71717a";
}
/**
 * Loads and displays habit statistics on the dashboard
 * Fetches all habits and calculates total count, maximum streak, and average streak
 * Also displays top 5 habits sorted by streak
 */
function loadHabitsStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all habits from API
            const habits = yield apiGet("/habits/");
            // Calculate aggregate statistics
            const totalHabits = habits.length;
            const maxStreak = habits.length > 0
                ? Math.max(...habits.map(h => h.streak))
                : 0;
            const avgStreak = habits.length > 0
                ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length)
                : 0;
            // Update statistics display elements
            const totalEl = document.getElementById("total-habits");
            const maxStreakEl = document.getElementById("max-streak");
            const avgStreakEl = document.getElementById("avg-streak");
            if (totalEl)
                totalEl.textContent = totalHabits.toString();
            if (maxStreakEl)
                maxStreakEl.textContent = maxStreak.toString();
            if (avgStreakEl)
                avgStreakEl.textContent = avgStreak.toString();
            // Display recent habits (top 5 sorted by streak)
            const recentHabitsEl = document.getElementById("recent-habits");
            if (recentHabitsEl) {
                const sortedHabits = [...habits]
                    .sort((a, b) => b.streak - a.streak)
                    .slice(0, 5);
                // Show empty state if no habits exist
                if (sortedHabits.length === 0) {
                    recentHabitsEl.innerHTML = '<p class="empty-state">No tenés hábitos aún. <a href="habits.html">Creá tu primer hábito</a></p>';
                }
                else {
                    // Render habit items with name and current streak
                    recentHabitsEl.innerHTML = sortedHabits.map(habit => `
                    <div class="habit-item">
                        <div class="habit-info">
                            <h4>${habit.name}</h4>
                            <span class="habit-frequency">${habit.frequency === 1 ? 'Diario' : 'Semanal'}</span>
                        </div>
                        <div class="habit-streak">
                            <span class="streak-badge">🔥 ${habit.streak}</span>
                        </div>
                    </div>
                `).join("");
                }
            }
        }
        catch (error) {
            console.error("Error loading habits:", error);
            // Show error state to user
            const recentHabitsEl = document.getElementById("recent-habits");
            if (recentHabitsEl) {
                recentHabitsEl.innerHTML = '<p class="error-state">Error al cargar hábitos</p>';
            }
        }
    });
}
/**
 * Loads and displays subject statistics on the dashboard
 * Fetches all subjects and calculates total count and average progress
 * Also displays upcoming exams and all subjects with their progress bars
 */
function loadSubjectsStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all subjects from API
            const subjects = yield apiGet("/subjects/");
            // Calculate aggregate statistics
            const totalSubjects = subjects.length;
            const avgProgress = subjects.length > 0
                ? Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length)
                : 0;
            // Update statistics display elements
            const totalEl = document.getElementById("total-subjects");
            const avgProgressEl = document.getElementById("avg-progress");
            if (totalEl)
                totalEl.textContent = totalSubjects.toString();
            if (avgProgressEl) {
                avgProgressEl.textContent = `${avgProgress}%`;
                // Update progress bar visualization
                const progressBar = document.getElementById("avg-progress-bar");
                if (progressBar) {
                    progressBar.style.width = `${avgProgress}%`;
                }
            }
            // Display upcoming exams section (subjects with exam dates)
            const upcomingExamsEl = document.getElementById("upcoming-exams");
            if (upcomingExamsEl) {
                // Filter subjects with exam dates and sort by nearest date
                const subjectsWithExams = subjects
                    .filter(s => s.next_exam_date)
                    .sort((a, b) => {
                    if (!a.next_exam_date || !b.next_exam_date)
                        return 0;
                    return new Date(a.next_exam_date).getTime() - new Date(b.next_exam_date).getTime();
                })
                    .slice(0, 5);
                // Show empty state if no exams scheduled
                if (subjectsWithExams.length === 0) {
                    upcomingExamsEl.innerHTML = '<p class="empty-state">No tenés exámenes programados</p>';
                }
                else {
                    // Render exam items with date and priority
                    upcomingExamsEl.innerHTML = subjectsWithExams.map(subject => {
                        const examDate = formatDate(subject.next_exam_date);
                        const priorityColor = getPriorityColor(subject.priority);
                        return `
                        <div class="subject-item">
                            <div class="subject-info">
                                <h4>${subject.name}</h4>
                                <span class="exam-date">${examDate}</span>
                            </div>
                            <div class="subject-meta">
                                <span class="priority-badge" style="background-color: ${priorityColor}20; color: ${priorityColor}">
                                    ${getPriorityName(subject.priority)}
                                </span>
                                <div class="progress-mini">
                                    <div class="progress-mini-bar" style="width: ${subject.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    `;
                    }).join("");
                }
            }
            // Display all subjects with progress tracking
            const allSubjectsEl = document.getElementById("all-subjects");
            if (allSubjectsEl) {
                // Show empty state if no subjects exist
                if (subjects.length === 0) {
                    allSubjectsEl.innerHTML = '<p class="empty-state">No tenés materias aún. <a href="subjects.html">Agregá tu primera materia</a></p>';
                }
                else {
                    // Render subject cards with progress bars and priority badges
                    allSubjectsEl.innerHTML = subjects.map(subject => {
                        const priorityColor = getPriorityColor(subject.priority);
                        return `
                        <div class="subject-card">
                            <div class="subject-header">
                                <h4>${subject.name}</h4>
                                <span class="priority-badge" style="background-color: ${priorityColor}20; color: ${priorityColor}">
                                    ${getPriorityName(subject.priority)}
                                </span>
                            </div>
                            <div class="progress-section">
                                <div class="progress-info">
                                    <span>Progreso</span>
                                    <span>${subject.progress}%</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${subject.progress}%"></div>
                                </div>
                            </div>
                        </div>
                    `;
                    }).join("");
                }
            }
        }
        catch (error) {
            console.error("Error loading subjects:", error);
        }
    });
}
let currentWeeklyFilter = 'all'; // Estado de filtro activo
function loadWeeklyObjectives() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const objectives = yield apiGet("/weekly-objectives/");
            const container = document.getElementById("weeklyObjectivesContainer");
            if (!container)
                return;
            localStorage.setItem('weeklyObjectives', JSON.stringify(objectives));
            // FILTRAR OBJETIVOS SEGÚN EL BOTÓN ACTIVO
            let filteredObjectives = objectives;
            if (currentWeeklyFilter === 'completed') {
                filteredObjectives = objectives.filter(obj => obj.is_completed);
            }
            else if (currentWeeklyFilter === 'incomplete') {
                filteredObjectives = objectives.filter(obj => !obj.is_completed);
            }
            const trans = t();
            if (filteredObjectives.length === 0) {
                let emptyTitle = trans.dashboard.emptyObjectivesTitle;
                let emptyDesc = trans.dashboard.emptyObjectivesDesc;
                let showAddVisual = true;
                if (currentWeeklyFilter === 'completed') {
                    emptyTitle = trans.dashboard.emptyCompletedTitle;
                    emptyDesc = trans.dashboard.emptyCompletedDesc;
                    showAddVisual = false;
                }
                else if (currentWeeklyFilter === 'incomplete') {
                    emptyTitle = trans.dashboard.emptyIncompleteTitle;
                    emptyDesc = trans.dashboard.emptyIncompleteDesc;
                    showAddVisual = false;
                }
                container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center animate-fade animated">
                    ${showAddVisual ? `
                    <div class="relative mb-5 group cursor-pointer" onclick="document.getElementById('addObjectiveBtn').click()">
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
                        <div class="relative w-20 h-20 bg-[#1a1d26] rounded-full flex items-center justify-center border border-gray-800 group-hover:border-purple-500/50 group-hover:scale-105 transition-all duration-300 shadow-xl">
                            <i data-lucide="crosshair" class="w-10 h-10 text-gray-500 group-hover:text-purple-400 transition-colors duration-300"></i>
                        </div>
                    </div>` : ''}

                    <h3 class="text-xl font-bold text-white mb-2 tracking-tight">
                        ${emptyTitle}
                    </h3>

                    <p class="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed ${showAddVisual ? 'mb-6' : ''}">
                        ${emptyDesc}
                    </p>

                    ${showAddVisual ? `
                    <div class="animate-bounce text-gray-700">
                        <i data-lucide="arrow-down" class="w-5 h-5"></i>
                    </div>` : ''}
                </div>
            `;
            }
            else {
                container.innerHTML = filteredObjectives.map(obj => {
                    const priorityMap = {
                        1: { name: trans.dashboard.highPriority, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
                        2: { name: trans.dashboard.keyExploration, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
                        3: { name: trans.dashboard.complementary, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
                    };
                    const priorityConfig = priorityMap[obj.priority || 2] || priorityMap[2];
                    const displayIcon = obj.icon || '⚡';
                    const displayArea = obj.area || 'General';
                    return `
                    <div class="objective-item bg-dark-input rounded-2xl p-5 relative group transition-all duration-300 hover:bg-[#1f222e] hover:translate-y-[-2px]" 
                        data-objective-id="${obj.id}" 
                        style="box-shadow: 0 0 0 1px rgba(255,255,255,0.05);">
                        
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex items-center gap-2.5 flex-1">
                                <span class="text-lg filter drop-shadow-md icon-display cursor-pointer hover:text-2xl transition-all" data-id="${obj.id}" title="Haz clic para editar" data-field="icon">
                                    ${displayIcon}
                                </span>
                                <span class="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-gray-200 to-gray-400 tracking-wide area-display cursor-pointer hover:opacity-80 transition-all" data-id="${obj.id}" title="Haz clic para editar" data-field="area">
                                    ${displayArea}
                                </span>
                            </div>
                            
                            <div class="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button class="complete-objective p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10 transition-all duration-200" data-id="${obj.id}" title="Completar">
                                    <i data-lucide="check" class="w-4 h-4"></i>
                                </button>
                                <button class="edit-objective p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200" data-id="${obj.id}" title="Editar">
                                    <i data-lucide="edit-3" class="w-4 h-4"></i>
                                </button>
                                <button class="delete-objective p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200" data-id="${obj.id}" title="Eliminar">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                </button>
                            </div>
                        </div>

                        <div class="text-white text-base font-semibold mb-2 leading-snug ${obj.is_completed ? 'line-through text-gray-500' : ''}">
                            ${obj.title}
                        </div>
                        
                        <p class="text-gray-500 text-xs mb-4 leading-relaxed line-clamp-2">
                            ${obj.detail}
                        </p>
                        
                        <div class="flex items-center justify-between mt-auto pt-3 border-t border-gray-800/50">
                            <span class="text-[10px] font-bold px-2 py-1 rounded tracking-wider" 
                                style="color: ${priorityConfig.color}; background: ${priorityConfig.bg}; border: 1px solid ${priorityConfig.border}">
                                ${priorityConfig.name}
                            </span>
                            
                            ${obj.notes ? `
                            <div class="flex items-center gap-1.5 text-xs text-purple-400/80">
                                <i data-lucide="folder-open" class="w-3 h-3"></i>
                                <span class="italic truncate max-w-[120px]">${obj.notes}</span>
                            </div>` : ''}
                        </div>
                    </div>
                `;
                }).join("");
                // Attach edit event handlers
                container.querySelectorAll('.edit-objective').forEach(btn => {
                    btn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        e.stopPropagation();
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        if (id) {
                            const objId = Number(id);
                            const objective = objectives.find(o => o.id === objId);
                            if (objective) {
                                // Populate modal with objective data
                                const titleEl = document.getElementById('objectiveTitle');
                                const detailEl = document.getElementById('objectiveDetail');
                                const areaEl = document.getElementById('objectiveArea');
                                const iconEl = document.getElementById('objectiveIcon');
                                const priorityEl = document.getElementById('objectivePriority');
                                const notesEl = document.getElementById('objectiveNotes');
                                if (titleEl)
                                    titleEl.value = objective.title;
                                if (detailEl)
                                    detailEl.value = objective.detail || '';
                                if (areaEl)
                                    areaEl.value = objective.area || 'General';
                                if (priorityEl)
                                    priorityEl.value = (objective.priority || 2).toString();
                                if (notesEl)
                                    notesEl.value = objective.notes || '';
                                // Change button text to "Update"
                                const submitBtn = document.getElementById('submitObjectiveBtn');
                                if (submitBtn) {
                                    submitBtn.textContent = trans.dashboard.updateObjective;
                                }
                                // Store objective ID for edit mode
                                window.editingObjectiveId = objId;
                                // Apply translations to modal (in case language changed)
                                applyTranslations();
                                // Show modal
                                const modal = document.getElementById('objectiveModal');
                                if (modal)
                                    modal.style.display = 'flex';
                            }
                        }
                    }));
                });
                // Attach delete event handlers
                container.querySelectorAll('.delete-objective').forEach(btn => {
                    btn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        e.stopPropagation();
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        if (id)
                            yield deleteObjective(Number(id));
                    }));
                });
                // Attach complete event handlers
                container.querySelectorAll('.complete-objective').forEach(btn => {
                    btn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        e.stopPropagation();
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        if (id)
                            yield toggleObjectiveCompletion(Number(id));
                    }));
                });
                // Attach inline edit handlers for icon and area (opens modal)
                container.querySelectorAll('.icon-display, .area-display').forEach(el => {
                    el.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        const id = el.getAttribute('data-id');
                        if (id) {
                            const objId = Number(id);
                            const objective = objectives.find(o => o.id === objId);
                            if (objective) {
                                // Populate modal with objective data
                                const titleEl = document.getElementById('objectiveTitle');
                                const detailEl = document.getElementById('objectiveDetail');
                                const areaEl = document.getElementById('objectiveArea');
                                const iconEl = document.getElementById('objectiveIcon');
                                const priorityEl = document.getElementById('objectivePriority');
                                const notesEl = document.getElementById('objectiveNotes');
                                if (titleEl)
                                    titleEl.value = objective.title;
                                if (detailEl)
                                    detailEl.value = objective.detail || '';
                                if (areaEl)
                                    areaEl.value = objective.area || 'General';
                                if (iconEl)
                                    iconEl.value = objective.icon || '⚡';
                                if (priorityEl)
                                    priorityEl.value = (objective.priority || 2).toString();
                                if (notesEl)
                                    notesEl.value = objective.notes || '';
                                // Change button text to "Update"
                                const submitBtn = document.getElementById('submitObjectiveBtn');
                                if (submitBtn) {
                                    submitBtn.textContent = trans.dashboard.updateObjective;
                                }
                                // Store objective ID for edit mode
                                window.editingObjectiveId = objId;
                                // Apply translations to modal (in case language changed)
                                applyTranslations();
                                // Show modal
                                const modal = document.getElementById('objectiveModal');
                                if (modal)
                                    modal.style.display = 'flex';
                            }
                        }
                    }));
                });
            }
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
        }
        catch (error) {
            console.error("Error loading weekly objectives:", error);
        }
    });
}
// --- FILTROS ---
function initWeeklyObjectivesFilters() {
    const buttons = document.querySelectorAll('#weeklyObjectivesFilters .filter-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('bg-purple-500', 'text-white'));
            buttons.forEach(b => b.classList.add('bg-gray-700', 'text-white'));
            btn.classList.add('bg-purple-500', 'text-white');
            const filter = btn.getAttribute('data-filter');
            currentWeeklyFilter = filter;
            loadWeeklyObjectives();
        });
    });
    // Estado inicial: "Todo" activo
    buttons.forEach(b => {
        if (b.getAttribute('data-filter') === 'all') {
            b.classList.add('bg-purple-500', 'text-white');
            b.classList.remove('bg-gray-700');
        }
    });
}
/**
 * Deletes a weekly objective after user confirmation
 * @param id - The ID of the objective to delete
 */
function deleteObjective(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const trans = t();
        const confirmed = yield showConfirmModal(trans.confirmations.deleteEventMessage, trans.common.delete);
        if (!confirmed)
            return;
        try {
            // Call API to delete objective
            yield apiDelete(`/weekly-objectives/${id}/`);
            // Reload objectives to reflect deletion
            loadWeeklyObjectives();
        }
        catch (error) {
            console.error("Error deleting objective:", error);
            yield showAlertModal('Error al eliminar el objetivo. Por favor, intenta nuevamente.', 'Error');
        }
    });
}
/**
 * Toggles completion status of a weekly objective
 * @param id - The ID of the objective to toggle
 */
function toggleObjectiveCompletion(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token)
            return;
        try {
            // First, get current objective to know current completion status
            const objectives = yield apiGet("/weekly-objectives/");
            const objective = objectives.find(o => o.id === id);
            if (!objective)
                return;
            // Toggle the completion status
            const newCompleted = !objective.is_completed;
            // Update via API
            yield apiPatch(`/weekly-objectives/${id}/`, { is_completed: newCompleted });
            // Reload objectives to reflect changes
            yield loadWeeklyObjectives();
            // Notify weekly challenge to reload (frontend will debounce)
            try {
                document.dispatchEvent(new CustomEvent('weeklyChallenge:update'));
            }
            catch (e) { }
        }
        catch (error) {
            console.error('Error toggling objective completion:', error);
            yield showAlertModal('Error al actualizar el objetivo. Por favor, intenta nuevamente.', 'Error');
        }
    });
}
/**
 * Opens the objective creation modal and loads available subjects
 */
function addObjective() {
    return __awaiter(this, void 0, void 0, function* () {
        const modal = document.getElementById('objectiveModal');
        if (!modal)
            return;
        // Load subjects for the select dropdown
        try {
            const subjects = yield apiGet('/subjects/');
            const subjectSelect = document.getElementById('objectiveSubject');
            if (subjectSelect) {
                const trans = t();
                subjectSelect.innerHTML = `<option value="">-- ${trans.habits.none} --</option>` +
                    subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }
        }
        catch (e) {
            console.warn('Could not load subjects for objective modal', e);
        }
        // Apply translations to modal (in case language changed)
        applyTranslations();
        // Show modal
        modal.style.display = 'flex';
    });
}
/**
 * Closes the objective modal and resets the form
 */
function closeObjectiveModal() {
    const modal = document.getElementById('objectiveModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Reset form fields
    const form = document.getElementById('objectiveForm');
    if (form) {
        form.reset();
    }
    // Reset editing state
    window.editingObjectiveId = null;
    // Restore button text to "Create"
    const submitBtn = document.getElementById('submitObjectiveBtn');
    if (submitBtn) {
        const trans = t();
        submitBtn.textContent = trans.dashboard.createObjective;
    }
}
/**
 * Handles objective form submission (both create and update)
 * @param e - Form submit event
 */
function submitObjectiveForm(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        // Get form elements
        const titleEl = document.getElementById('objectiveTitle');
        const detailEl = document.getElementById('objectiveDetail');
        const areaEl = document.getElementById('objectiveArea');
        const iconEl = document.getElementById('objectiveIcon');
        const priorityEl = document.getElementById('objectivePriority');
        const notesEl = document.getElementById('objectiveNotes');
        // Validate required field
        if (!titleEl || !titleEl.value) {
            alert('Por favor ingresá un título');
            return;
        }
        try {
            // Build objective data object
            const objectiveData = {
                title: titleEl.value,
                detail: (detailEl === null || detailEl === void 0 ? void 0 : detailEl.value) || '',
                notes: (notesEl === null || notesEl === void 0 ? void 0 : notesEl.value) || '',
                priority: (priorityEl === null || priorityEl === void 0 ? void 0 : priorityEl.value) ? Number(priorityEl.value) : 2,
                area: (areaEl === null || areaEl === void 0 ? void 0 : areaEl.value) || 'General',
                icon: (iconEl === null || iconEl === void 0 ? void 0 : iconEl.value) || '⚡',
                subject: null
            };
            console.log("Sending objective data:", objectiveData);
            const editingId = window.editingObjectiveId;
            if (editingId) {
                // Update existing objective
                console.log(`Updating objective ${editingId}...`);
                yield apiPut(`/weekly-objectives/${editingId}/`, objectiveData);
                window.editingObjectiveId = null;
            }
            else {
                // Create new objective
                console.log("Creating new objective...");
                yield apiPost('/weekly-objectives/', objectiveData, true);
            }
            // Close modal and reload objectives
            closeObjectiveModal();
            yield loadWeeklyObjectives();
            // Notify weekly challenge reload (debounced)
            try {
                document.dispatchEvent(new CustomEvent('weeklyChallenge:update'));
            }
            catch (e) { }
        }
        catch (error) {
            console.error("Error creating/updating objective:", error);
            alert('Error al guardar el objetivo');
        }
    });
}
// Loads the weekly challenge and updates the dashboard UI
/**
 * Loads and displays the active weekly challenge
 *
 * ARCHITECTURE:
 * - Backend computes ALL business logic (progress, status, etc)
 * - Frontend ONLY renders the DTO received
 * - NO calculations happen here
 *
 * Behavior:
 * - GET /api/weekly-challenge/active/ (returns 200 with challenge DTO)
 * - Renders challenge in [data-challenge-container]
 * - Idempotent - safe to call multiple times
 * - Graceful error handling
 */
export function loadWeeklyChallenge() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('[loadWeeklyChallenge] Starting...');
            // Fetch challenge DTO from backend
            const challenge = yield apiGet("/weekly-challenge/active/");
            console.log('[loadWeeklyChallenge] Response:', challenge);
            // Backend guarantees this won't be null (creates if needed)
            if (!challenge) {
                console.warn("Unexpected: Backend returned null for active challenge");
                renderEmptyChallengeState();
                return;
            }
            // Render the DTO as-is (no transformations)
            renderWeeklyChallengeUI(challenge);
            console.log('[loadWeeklyChallenge] Rendered UI');
        }
        catch (error) {
            console.error("Error loading weekly challenge:", error);
            renderErrorChallengeState();
        }
    });
}
// Debounced reload handler for external actions (habits/objectives/pomodoros)
let _weeklyChallengeReloadTimer = null;
document.addEventListener('weeklyChallenge:update', () => {
    // Debounce multiple rapid events
    try {
        console.log('[loadWeeklyChallenge:listener] Event received, debouncing...');
        if (_weeklyChallengeReloadTimer)
            window.clearTimeout(_weeklyChallengeReloadTimer);
        _weeklyChallengeReloadTimer = window.setTimeout(() => {
            console.log('[loadWeeklyChallenge:listener] Debounce complete, loading challenge...');
            loadWeeklyChallenge().catch((e) => console.error('Error reloading weekly challenge:', e));
            _weeklyChallengeReloadTimer = null;
        }, 300);
    }
    catch (e) {
        // ignore in non-browser env
    }
});
/**
 * Renders the weekly challenge UI from the DTO
 *
 * IMPORTANT: Does NOT calculate or modify data
 * Uses challenge data exactly as received from backend
 *
 * @param challenge - WeeklyChallengeDTO from backend
 */
function renderWeeklyChallengeUI(challenge) {
    const container = document.querySelector('[data-challenge-container]');
    if (!container)
        return;
    // Determine styling based on status (no other logic)
    const isCompleted = challenge.status === 'completed';
    const statusIcon = isCompleted ? 'check-circle' : 'zap';
    const statusBadgeColor = isCompleted
        ? 'bg-green-500/20 text-green-400 border-green-500/30'
        : 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    const progressBarColor = isCompleted
        ? 'from-green-500 via-emerald-500 to-green-500'
        : 'from-purple-500 via-pink-500 to-purple-500';
    const progressGlowColor = isCompleted
        ? 'rgba(34,197,94,0.5)'
        : 'rgba(168,85,247,0.5)';
    // Build status badge
    const statusBadge = `
    <span class="px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeColor} flex items-center gap-1" style="width: fit-content;">
      <i data-lucide="${statusIcon}" class="w-3 h-3"></i>
      <span data-i18n="dashboard.${isCompleted ? 'completed' : 'active'}">
        ${isCompleted ? 'Completado' : 'Activo'}
      </span>
    </span>
  `;
    // Build progress text using DTO values
    const progressText = `${challenge.current_value} de ${challenge.target_value} completados`;
    // Render container
    container.innerHTML = `
    <div class="space-y-4">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="text-white font-medium mb-1">${challenge.title}</h3>
          <p class="text-gray-500 text-sm mb-4">${challenge.description}</p>
        </div>
        <div class="flex-shrink-0">
          ${statusBadge}
        </div>
      </div>
      
      <div class="space-y-2">
        <div class="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div class="bg-gradient-to-r ${progressBarColor} h-2 rounded-full transition-all duration-500 ease-out" 
               style="width: ${Math.min(challenge.progress_percentage, 100)}%; box-shadow: 0 0 10px ${progressGlowColor};">
          </div>
        </div>
        <div class="flex justify-between items-center">
          <span class="text-xs bg-gradient-to-r ${isCompleted ? 'from-green-400 to-emerald-400' : 'from-purple-400 to-pink-400'} bg-clip-text text-transparent font-medium">
            ${progressText}
          </span>
          <span class="text-xs text-gray-500">${challenge.progress_percentage.toFixed(0)}%</span>
        </div>
      </div>
      
      <div class="text-xs text-gray-400 pt-2 border-t border-gray-800">
        <span>Recompensa: </span>
        <span class="text-purple-400 font-medium">+50 XP</span>
      </div>
    </div>
  `;
    // Render lucide icons
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
    // Ensure the container is visible in case an entrance animation left it at opacity:0
    try {
        const wrapper = document.querySelector('[data-challenge-container]');
        if (wrapper) {
            wrapper.style.transition = wrapper.style.transition || 'opacity 250ms ease';
            wrapper.style.opacity = '1';
            wrapper.style.visibility = 'visible';
            wrapper.classList.remove('animate-fade', 'animated');
        }
    }
    catch (e) {
        // no-op: defensive in case DOM APIs are restricted in some tests
    }
}
/**
 * Render empty state when no challenge
 */
function renderEmptyChallengeState() {
    const container = document.querySelector('[data-challenge-container]');
    if (!container)
        return;
    container.innerHTML = `
    <div class="text-center py-6">
      <i data-lucide="award" class="w-8 h-8 text-gray-500 mx-auto mb-2"></i>
      <p class="text-gray-400 text-sm">No hay desafío activo</p>
    </div>
  `;
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
        lucide.createIcons();
    }
}
/**
 * Render error state
 */
function renderErrorChallengeState() {
    const container = document.querySelector('[data-challenge-container]');
    if (!container)
        return;
    container.innerHTML = `
    <div class="text-center py-4">
      <p class="text-red-400 text-sm">Error al cargar el desafío semanal</p>
    </div>
  `;
}
/**
 * Loads and displays Pomodoro session statistics
 * Fetches sessions and calculates today's totals and recent sessions
 */
function loadPomodoroStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all Pomodoro sessions from API
            const sessions = yield apiGet("/pomodoro/");
            // Get today's date at midnight for display purposes
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Filter sessions from today
            const todaySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                sessionDate.setHours(0, 0, 0, 0);
                return sessionDate.getTime() === today.getTime();
            });
            // Calculate today's statistics (display)
            const totalMinutesToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
            const totalSessionsToday = todaySessions.length;
            // Compute week start (client local) and count sessions this week
            const weekStart = getStartOfWeekInUserTZ((yield getCurrentUser()).timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
            const totalSessionsThisWeek = sessions.filter(s => new Date(s.start_time) >= weekStart).length;
            // Update statistics display
            const sessionsTodayEl = document.getElementById("sessions-today");
            const minutesTodayEl = document.getElementById("minutes-today");
            if (sessionsTodayEl)
                sessionsTodayEl.textContent = totalSessionsToday.toString();
            if (minutesTodayEl)
                minutesTodayEl.textContent = totalMinutesToday.toString();
            // Notify listeners about updated session counts so in-memory counters
            // can sync inside the Pomodoro IIFE (avoids cross-scope references)
            try {
                document.dispatchEvent(new CustomEvent('pomodoro:sessionsUpdated', { detail: { totalSessionsThisWeek } }));
            }
            catch (e) { /* ignore if environment disallows CustomEvent */ }
            // Display recent sessions (last 5)
            const recentSessionsEl = document.getElementById("recent-sessions");
            if (recentSessionsEl) {
                // Sort by start time descending and take top 5
                const recentSessions = sessions
                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                    .slice(0, 5);
                // Show empty state if no sessions
                if (recentSessions.length === 0) {
                    recentSessionsEl.innerHTML = '<p class="empty-state">No tenés sesiones de Pomodoro aún</p>';
                }
                else {
                    // Render session items with duration and date
                    recentSessionsEl.innerHTML = recentSessions.map(session => {
                        const sessionDate = new Date(session.start_time);
                        const dateStr = sessionDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                        return `
                        <div class="pomodoro-item">
                            <div class="pomodoro-info">
                                <h4>${session.duration} min</h4>
                                <span class="pomodoro-date">${dateStr}</span>
                            </div>
                            ${session.notes ? `<p class="pomodoro-notes">${session.notes}</p>` : ''}
                        </div>
                    `;
                    }).join("");
                }
            }
        }
        catch (error) {
            console.error("Error loading pomodoro sessions:", error);
        }
    });
}
function getStartOfWeekInUserTZ(timezone) {
    // Current time in user's timezone
    const now = new Date(new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    }).format(new Date()));
    const day = now.getDay(); // 0 = Sunday, 1 = Monday
    const diffToMonday = day === 0 ? 6 : day - 1;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
}
/**
 * Loads and displays weekly study rhythm based on Pomodoro sessions
 * Creates a line chart showing study time for each day of the week
 */
function loadWeeklyStudyRhythm() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const currentUser = yield getCurrentUser();
        const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
        const startOfWeek = getStartOfWeekInUserTZ(userTimezone);
        try {
            // 1. Load translations at the beginning
            const trans = t();
            // Fetch all Pomodoro sessions
            const sessions = yield apiGet("/pomodoro/");
            // Get start of current week in user's timezone
            const startOfWeek = getStartOfWeekInUserTZ(userTimezone);
            // Filter weekly sessions correctly
            const weeklySessions = sessions
                .map(s => (Object.assign(Object.assign({}, s), { date: new Date(s.start_time) }))) // UTC → Date
                .filter(s => s.date >= startOfWeek);
            // Group minutes by day of week (0 = Sunday, 1 = Monday, etc.)
            const dayMinutes = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            weeklySessions.forEach(session => {
                const dayOfWeek = session.date.getDay();
                dayMinutes[dayOfWeek] += session.duration;
            });
            // 2. Get abbreviated days from translation (Mon, Tue, etc.)
            const weekDaysAbbrebiation = trans.dashboard.weekDaysAbbrebiation;
            // Convert to array for chart (Monday to Sunday)
            const dataPoints = [
                dayMinutes[1], // Monday
                dayMinutes[2], // Tuesday
                dayMinutes[3], // Wednesday
                dayMinutes[4], // Thursday
                dayMinutes[5], // Friday
                dayMinutes[6], // Saturday
                dayMinutes[0] // Sunday
            ];
            // Find maximum value for scaling
            const maxMinutes = Math.max(...dataPoints, 1);
            const maxHeight = 120; // Maximum chart height in pixels
            // Update chart SVG
            const chartContainer = document.getElementById('weekly-rhythm-chart');
            const chartParent = chartContainer === null || chartContainer === void 0 ? void 0 : chartContainer.parentElement;
            if (chartContainer && chartParent) {
                // Update the existing labels container in the HTML
                // We select the div with specific classes found in your HTML
                const labelsContainer = chartParent.querySelector('.absolute.bottom-0.flex');
                if (labelsContainer) {
                    labelsContainer.innerHTML = weekDaysAbbrebiation
                        .map(day => `<span>${day}</span>`)
                        .join('');
                }
                // Show empty state if no sessions this week
                if (weeklySessions.length === 0) {
                    // Keep the container structure but replace content or overlay message
                    // Note: If you want to replace the WHOLE content including labels, do it here.
                    // Assuming we want to show a message over the chart area:
                    const svg = chartContainer;
                    svg.innerHTML = `
                    <foreignObject width="100%" height="100%">
                         <div class="flex flex-col items-center justify-center h-full pb-6">
                            <i data-lucide="bar-chart-2" class="w-8 h-8 text-gray-600 mb-2"></i>
                            <p class="text-gray-500 text-xs text-center">${trans.dashboard.emptyRhythmTitle}</p>
                        </div>
                    </foreignObject>
                `;
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
                    return;
                }
                const svg = chartContainer;
                const width = 450;
                const step = width / 6;
                // Generate smooth curve path for line chart
                let pathD = '';
                const points = [];
                dataPoints.forEach((minutes, index) => {
                    const x = index * step;
                    const y = maxHeight - (minutes / maxMinutes) * maxHeight;
                    points.push({ x, y });
                });
                // Create smooth path with curves
                if (points.length > 1) {
                    let smoothPath = `M ${points[0].x} ${points[0].y}`;
                    for (let i = 1; i < points.length; i++) {
                        const prev = points[i - 1];
                        const curr = points[i];
                        const cp1x = prev.x + (curr.x - prev.x) / 2;
                        const cp1y = prev.y;
                        const cp2x = curr.x - (curr.x - prev.x) / 2;
                        const cp2y = curr.y;
                        smoothPath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                    }
                    pathD = smoothPath;
                }
                else if (points.length === 1) {
                    pathD = `M ${points[0].x} ${points[0].y}`;
                }
                // 3. Get full day names for tooltips
                const weekDays = trans.dashboard.weekDays;
                // Render SVG with path and data points
                svg.innerHTML = `
                <path d="${pathD}" fill="none" stroke="#c084fc" stroke-width="3" />
                ${points.map((p, index) => {
                    const minutes = dataPoints[index];
                    const hours = (minutes / 60).toFixed(1);
                    return `
                        <g>
                            <circle cx="${p.x}" cy="${p.y}" r="4" fill="#1e212b" stroke="#c084fc" stroke-width="2" 
                                    class="cursor-pointer hover:r-6 transition-all" 
                                    data-day="${weekDays[index]}" 
                                    data-hours="${hours}"
                                    data-minutes="${minutes}"/>
                            <title>${weekDays[index]}: ${hours}h (${minutes} min)</title>
                        </g>
                    `;
                }).join('')}
            `;
                // Add interactive tooltips
                const circles = svg.querySelectorAll('circle');
                circles.forEach((circle, index) => {
                    const minutes = dataPoints[index];
                    const hours = (minutes / 60).toFixed(1);
                    const day = weekDays[index];
                    circle.addEventListener('mouseenter', (e) => {
                        const tooltip = document.createElement('div');
                        tooltip.id = 'rhythm-tooltip';
                        tooltip.className = 'fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none';
                        tooltip.innerHTML = `
                        <div class="font-bold text-purple-400">${day}</div>
                        <div class="text-gray-300">${hours}h (${minutes} min)</div>
                    `;
                        document.body.appendChild(tooltip);
                        // Position near cursor
                        updateTooltipPosition(tooltip, e.clientX, e.clientY);
                    });
                    circle.addEventListener('mouseleave', () => {
                        const tooltip = document.getElementById('rhythm-tooltip');
                        if (tooltip)
                            tooltip.remove();
                    });
                    circle.addEventListener('mousemove', (e) => {
                        const tooltip = document.getElementById('rhythm-tooltip');
                        if (tooltip) {
                            updateTooltipPosition(tooltip, e.clientX, e.clientY);
                        }
                    });
                });
            }
        }
        catch (error) {
            console.error("Error loading weekly study rhythm:", error);
        }
    });
}
/**
 * Loads and displays focus distribution among subjects
 * Creates a pie chart showing percentage of study time per subject
 */
function loadFocusDistribution() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const trans = t();
        try {
            // 1. Fetch current user to get timezone
            const currentUser = yield getCurrentUser();
            const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            // 2. Fetch sessions and subjects
            const sessions = yield apiGet("/pomodoro/");
            const subjects = yield apiGet("/subjects/");
            // 3. Calculate start of the week in user's timezone
            const startOfWeek = getStartOfWeekInUserTZ(userTimezone);
            // 4. Filter sessions for current week
            const weeklySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                return sessionDate >= startOfWeek;
            });
            // 5. Group minutes by subject
            const subjectMinutes = {};
            let totalMinutes = 0;
            weeklySessions.forEach(session => {
                let subjectId = null;
                if (session.subject !== null && session.subject !== undefined) {
                    subjectId = typeof session.subject === 'string' ? parseInt(session.subject) : session.subject;
                }
                const key = subjectId !== null && !isNaN(subjectId) ? subjectId : -1;
                if (!subjectMinutes[key])
                    subjectMinutes[key] = 0;
                subjectMinutes[key] += session.duration;
                totalMinutes += session.duration;
            });
            // 6. Prepare data for chart
            const subjectData = Object.entries(subjectMinutes)
                .filter(([_, minutes]) => minutes > 0)
                .map(([id, minutes]) => {
                const subjectId = parseInt(id);
                let name = trans.dashboard.focusDistributionNoSubject;
                if (subjectId !== -1) {
                    const subject = subjects.find(s => s.id === subjectId);
                    name = subject ? subject.name : `Materia ${subjectId}`;
                }
                return {
                    id: subjectId,
                    name,
                    minutes,
                    percentage: totalMinutes > 0 ? (minutes / totalMinutes) * 100 : 0
                };
            })
                .sort((a, b) => b.minutes - a.minutes);
            // 7. Render pie chart (colores y gradiente)
            const colors = ['#a855f7', '#60a5fa', '#34d399', '#fbbf24', '#ec4899', '#8b5cf6'];
            let currentPercent = 0;
            const conicGradient = subjectData
                .map((subject, index) => {
                const color = colors[index % colors.length];
                const start = currentPercent;
                currentPercent += subject.percentage;
                return `${color} ${start}% ${currentPercent}%`;
            })
                .join(', ');
            const pieChart = document.getElementById('focus-distribution-chart');
            const pieChartParent = pieChart === null || pieChart === void 0 ? void 0 : pieChart.parentElement;
            if (pieChart && pieChartParent) {
                if (weeklySessions.length === 0 || subjectData.length === 0) {
                    pieChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">${trans.dashboard.emptyDistributionTitle}</p>
                        <p class="text-gray-600 text-xs text-center mt-1">${trans.dashboard.emptyDistributionDesc}</p>
                    </div>
                `;
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
                    return;
                }
                pieChart.style.background = `conic-gradient(${conicGradient})`;
                const totalHoursEl = document.getElementById('focus-total-hours');
                if (totalHoursEl) {
                    if (totalMinutes < 60)
                        totalHoursEl.textContent = `${totalMinutes}m`;
                    else {
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        totalHoursEl.textContent = mins === 0 ? `${hours}h` : `${hours}h ${mins}m`;
                    }
                }
                const legendContainer = document.getElementById('focus-legend');
                if (legendContainer) {
                    legendContainer.innerHTML = subjectData.slice(0, 4).map((subject, index) => {
                        const color = colors[index % colors.length];
                        return `
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
                            <span class="text-[10px] text-gray-400">${subject.name}</span>
                        </div>
                    `;
                    }).join('');
                }
            }
        }
        catch (error) {
            console.error("Error loading focus distribution:", error);
        }
    });
}
function loadPeakProductivity() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const trans = t();
            const DAYS_ANALYZED = 28;
            const MIN_SESSIONS = 3;
            const MIN_TOTAL_MINUTES = 60;
            // 1. Fetch current user to get timezone
            const currentUser = yield getCurrentUser();
            const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            // 2. Fetch sessions
            const sessions = yield apiGet("/pomodoro/");
            // 3. Calculate start of 4-week period in user's timezone
            const today = new Date();
            let startOfPeriod = getStartOfWeekInUserTZ(userTimezone); // start of current week
            startOfPeriod.setDate(startOfPeriod.getDate() - 21); // go back 3 weeks to have 4 weeks total
            // 4. Filter valid sessions in period
            const recentSessions = sessions
                .map(s => (Object.assign(Object.assign({}, s), { date: new Date(s.start_time) })))
                .filter(s => {
                if (!s || !s.start_time || typeof s.duration !== 'number')
                    return false;
                if (isNaN(s.date.getTime()))
                    return false;
                if (s.date > today)
                    return false;
                if (s.duration <= 0)
                    return false;
                return s.date >= startOfPeriod;
            });
            const renderEmptyState = () => {
                const peakEl = document.getElementById('peak-productivity-time');
                if (peakEl)
                    peakEl.textContent = trans.dashboard.emptyPeakProductivityTitle;
                const descriptionEl = document.getElementById('peak-productivity-desc');
                if (descriptionEl)
                    descriptionEl.textContent = trans.dashboard.emptyPeakProductivityDesc;
            };
            if (recentSessions.length < MIN_SESSIONS) {
                renderEmptyState();
                return;
            }
            const totalMinutes = recentSessions.reduce((sum, s) => sum + s.duration, 0);
            if (totalMinutes < MIN_TOTAL_MINUTES) {
                renderEmptyState();
                return;
            }
            // 5. Group minutes by day and hour
            const dayHourMinutes = {};
            recentSessions.forEach(session => {
                var _a;
                const day = session.date.getDay();
                const hour = session.date.getHours();
                (_a = dayHourMinutes[day]) !== null && _a !== void 0 ? _a : (dayHourMinutes[day] = {});
                dayHourMinutes[day][hour] = (dayHourMinutes[day][hour] || 0) + session.duration;
            });
            // 6. Find peak productivity
            let bestDay = -1;
            let bestHour = -1;
            let maxMinutes = 0;
            Object.entries(dayHourMinutes).forEach(([day, hours]) => {
                Object.entries(hours).forEach(([hour, minutes]) => {
                    if (minutes > maxMinutes) {
                        maxMinutes = minutes;
                        bestDay = Number(day);
                        bestHour = Number(hour);
                    }
                });
            });
            if (bestDay === -1 || bestHour === -1) {
                renderEmptyState();
                return;
            }
            const startHour = Math.max(0, bestHour - 1);
            const endHour = Math.min(23, bestHour + 1);
            const formatHour = (h) => `${h.toString().padStart(2, '0')}:00`;
            const peakEl = document.getElementById('peak-productivity-time');
            if (peakEl) {
                const dayName = trans.dashboard.days[bestDay];
                peakEl.textContent = `${dayName}, ${formatHour(startHour)} - ${formatHour(endHour)}`;
            }
            const descriptionEl = document.getElementById('peak-productivity-desc');
            if (descriptionEl) {
                descriptionEl.textContent = trans.dashboard.peakProductivityAnalysisDesc;
            }
        }
        catch (error) {
            console.error('Error loading peak productivity:', error);
        }
    });
}
/**
 * Helper function to position tooltip near the cursor
 * @param tooltip - The tooltip element to position
 * @param mouseX - Mouse X coordinate
 * @param mouseY - Mouse Y coordinate
 */
function updateTooltipPosition(tooltip, mouseX, mouseY) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = 15; // Distance from cursor to tooltip
    // Position to the right and above cursor by default
    let left = mouseX + offset;
    let top = mouseY - tooltipRect.height - offset;
    // Adjust if tooltip goes off-screen horizontally
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = mouseX - tooltipRect.width - offset; // Position to the left
    }
    if (left < 10) {
        left = 10;
    }
    // Adjust if tooltip goes off-screen vertically
    if (top < 10) {
        top = mouseY + offset; // Position below cursor
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - tooltipRect.height - 10;
    }
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}
/**
 * Toggles habit completion status (marks as complete or incomplete for today)
 * Updates UI optimistically and calls API to persist changes
 * @param habitId - ID of the habit to toggle
 * @param complete - Whether to mark complete (true) or incomplete (false)
 */
function toggleHabitCompletion(habitId, complete) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const token = getToken();
        if (!token)
            return;
        try {
            // Optimistic UI update (updates immediately before API response)
            const habitElement = (_a = document.querySelector(`[data-habit-id="${habitId}"]`)) === null || _a === void 0 ? void 0 : _a.closest('.flex.items-center.justify-between');
            if (habitElement) {
                const checkbox = habitElement.querySelector('.w-6.h-6.rounded');
                const textElement = habitElement.querySelector('.flex.items-center.gap-2');
                const streakElement = (_b = habitElement.querySelector('.text-xs')) === null || _b === void 0 ? void 0 : _b.parentElement;
                if (checkbox && textElement) {
                    if (complete) {
                        // Style checkbox for completed state
                        checkbox.className = 'w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center';
                        checkbox.style.boxShadow = '0 0 0 1px rgba(168,85,247,0.3)';
                        checkbox.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>';
                        textElement.className = 'flex items-center gap-2 text-gray-400 line-through';
                    }
                    else {
                        // Style checkbox for incomplete state
                        checkbox.className = 'w-6 h-6 rounded border border-gray-600 flex items-center justify-center group-hover:border-purple-500';
                        checkbox.style.boxShadow = '';
                        checkbox.innerHTML = '';
                        textElement.className = 'flex items-center gap-2 text-gray-300 font-medium';
                    }
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
                }
            }
            // Call API to persist change
            const response = yield fetch(`http://127.0.0.1:8000/api/habits/${habitId}/complete/`, {
                method: complete ? "POST" : "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                }
            });
            if (!response.ok)
                throw new Error("API Error");
            // Update streak from response data
            const data = yield response.json();
            if (data.streak !== undefined && habitElement) {
                const streakText = (_c = habitElement.querySelector('.text-xs')) === null || _c === void 0 ? void 0 : _c.textContent;
                if (streakText) {
                    const streakMatch = streakText.match(/\d+/);
                    if (streakMatch) {
                        const streakEl = habitElement.querySelector('.text-xs');
                        if (streakEl) {
                            streakEl.innerHTML = `<i data-lucide="trending-up" class="w-3 h-3"></i> ${data.streak}`;
                            if (typeof lucide !== 'undefined')
                                lucide.createIcons();
                        }
                    }
                }
            }
            // Reload habits to update full state
            loadKeyHabits();
        }
        catch (err) {
            console.error("Error toggling habit:", err);
            alert("Error de conexión. No se guardó.");
            // Reload to revert changes on error
            loadKeyHabits();
        }
    });
}
/**
 * Loads and displays key (important) habits on the dashboard
 * Shows daily completion progress for key habits only
 */
function loadKeyHabits() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // 1. Initialize translations at the start to use them globally within the function
            const trans = t();
            // Fetch all habits
            const habits = yield apiGet("/habits/");
            // Filter only key habits
            const keyHabits = habits.filter(h => h.is_key);
            const keyHabitsContainer = document.getElementById('key-habits-container');
            if (!keyHabitsContainer)
                return;
            // Show empty state if no key habits
            if (keyHabits.length === 0) {
                keyHabitsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="target" class="w-8 h-8 mx-auto mb-2 text-gray-600"></i>
                    <p class="text-sm">${trans.dashboard.emptyKeyHabitsTitle}</p>
                    <p class="text-xs mt-1">${trans.dashboard.emptyKeyHabitsDesc}</p>
                </div>
            `;
                if (typeof lucide !== 'undefined')
                    lucide.createIcons();
                return;
            }
            // Sort by streak descending
            const sortedHabits = [...keyHabits].sort((a, b) => b.streak - a.streak);
            // Calculate daily progress (percentage of habits completed today)
            const completedToday = sortedHabits.filter(h => h.completed_today).length;
            const dailyProgress = sortedHabits.length > 0
                ? Math.round((completedToday / sortedHabits.length) * 100)
                : 0;
            // Render habit items
            keyHabitsContainer.innerHTML = sortedHabits.map(habit => {
                const isCompleted = habit.completed_today;
                return `
                <div class="flex items-center justify-between bg-dark-input p-4 rounded-xl relative group transition-all duration-300" 
                    style="box-shadow: 0 0 0 1px rgba(168,85,247,0.15), 0 0 15px rgba(168,85,247,0.08);"
                    data-habit-id="${habit.id}">
                    <div class="flex items-center gap-4 flex-1">
                        <button class="habit-complete-btn w-6 h-6 rounded ${isCompleted ? 'bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center cursor-pointer' : 'border border-gray-600 flex items-center justify-center group-hover:border-purple-500 cursor-pointer transition-all'}" 
                            style="${isCompleted ? 'box-shadow: 0 0 0 1px rgba(168,85,247,0.3);' : ''}"
                            data-habit-id="${habit.id}"
                            data-completed="${isCompleted}"
                            title="${isCompleted ? 'Marcar como no completado' : 'Marcar como completado'}">
                            ${isCompleted ? '<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>' : ''}
                        </button>
                        <div class="flex items-center gap-2 ${isCompleted ? 'text-gray-400 line-through' : 'text-gray-300 font-medium'}">
                            <i data-lucide="target" class="w-4 h-4 text-purple-400"></i>
                            ${habit.name}
                        </div>
                    </div>
                    <div class="flex items-center gap-1 text-xs bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                        <i data-lucide="trending-up" class="w-3 h-3"></i>
                        <p class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                            ${trans.dashboard.keyHabitsStreak || 'Streak:'} ${habit.streak}
                        </p>
                    </div>
                </div>
            `;
            }).join('');
            // Attach click handlers to completion buttons
            keyHabitsContainer.querySelectorAll('.habit-complete-btn').forEach(button => {
                button.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                    e.stopPropagation();
                    const btn = e.currentTarget;
                    const id = Number(btn.getAttribute('data-habit-id'));
                    const completed = btn.getAttribute('data-completed') === 'true';
                    yield toggleHabitCompletion(id, !completed);
                }));
            });
            // Update daily progress bar
            const progressBar = document.getElementById('daily-progress-bar');
            const progressText = document.getElementById('daily-progress-text');
            if (progressBar) {
                progressBar.style.width = `${dailyProgress}%`;
            }
            if (progressText) {
                progressText.textContent = `${dailyProgress}%`;
            }
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
        }
        catch (error) {
            console.error("Error loading key habits:", error);
        }
    });
}
// Make sure to import getCurrentLanguage at the top of your file:
// import { t, translations, getCurrentLanguage } from "./i18n.js";
/**
 * Load and display the next upcoming event
 */
function loadNextEvent() {
    return __awaiter(this, void 0, void 0, function* () {
        const trans = t();
        const container = document.getElementById('nextEventContainer');
        if (!container)
            return;
        try {
            const events = yield getEvents();
            // Get current date and time
            const now = new Date();
            const upcomingEvents = events
                .filter(event => {
                // Create date object from event date and start time
                // Assuming format YYYY-MM-DD and HH:MM
                const eventStart = new Date(`${event.date}T${event.start_time}`);
                // Filter events that are strictly in the future
                return eventStart > now;
            })
                .sort((a, b) => {
                // Sort by date and time (ascending)
                const dateA = new Date(`${a.date}T${a.start_time}`);
                const dateB = new Date(`${b.date}T${b.start_time}`);
                return dateA.getTime() - dateB.getTime();
            });
            if (upcomingEvents.length === 0) {
                // Show empty state
                container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-8">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="calendar-x" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${trans.dashboard.emptyNextEventTitle}</h3>
                    <p class="text-gray-400 text-sm mb-4 text-center">${trans.dashboard.emptyNextEventDesc}</p>
                    <a href="planner.html" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>${trans.dashboard.emptyNextEventAction}</span>
                    </a>
                </div>
            `;
                if (typeof lucide !== 'undefined')
                    lucide.createIcons();
                return;
            }
            const nextEvent = upcomingEvents[0];
            // Format time for display
            const startTime = nextEvent.start_time.substring(0, 5);
            const endTime = nextEvent.end_time.substring(0, 5);
            // --- Smart Date Display Logic ---
            const lang = typeof getCurrentLanguage === 'function' ? getCurrentLanguage() : 'es';
            // Create date objects resetting time to midnight for accurate day comparison
            const eventDateObj = new Date(`${nextEvent.date}T00:00:00`);
            const todayObj = new Date();
            todayObj.setHours(0, 0, 0, 0);
            let dateDisplayString;
            // Check if event date is today
            if (eventDateObj.getTime() === todayObj.getTime()) {
                // Dictionary for "Today"
                const todayTrans = {
                    es: 'Hoy',
                    en: 'Today',
                    pt: 'Hoje',
                    zh: '今天'
                };
                dateDisplayString = todayTrans[lang] || 'Hoy';
            }
            else {
                // If not today, format full date (e.g., "Mon, Jan 12")
                // We force uppercase first letter for aesthetics
                const rawDate = eventDateObj.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'short' });
                dateDisplayString = rawDate.charAt(0).toUpperCase() + rawDate.slice(1);
            }
            // --------------------------------
            // Get event type display name
            const typeNames = {
                1: trans.dashboard.eventTypeStudyBlock,
                2: trans.dashboard.eventTypeExam,
                3: trans.dashboard.eventTypeImportantTask,
                4: trans.dashboard.eventTypePersonal
            };
            const typeClass = nextEvent.type === 2 ? 'exam' : nextEvent.type === 3 ? 'task' : nextEvent.type === 4 ? 'personal' : '';
            container.innerHTML = `
            <div class="space-y-4">
                <div class="event-item ${typeClass} p-4">
                    <div class="flex items-start justify-between mb-2">
                        <h3 class="text-lg font-bold text-white">${nextEvent.title}</h3>
                        <span class="text-xs px-2 py-1 rounded bg-purple-500/20 text-purple-400">${typeNames[nextEvent.type] || 'Evento'}</span>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-400">
                        <div class="flex items-center gap-1">
                            <i data-lucide="calendar" class="w-4 h-4"></i>
                            <span class="font-medium text-purple-300">${dateDisplayString}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            <span>${startTime} - ${endTime}</span>
                        </div>
                    </div>
                    ${nextEvent.notes ? `<p class="text-sm text-gray-500 mt-2">${nextEvent.notes}</p>` : ''}
                </div>
                <a href="planner.html" class="block text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    ${trans.dashboard.plannerFull}
                </a>
            </div>
        `;
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
        }
        catch (error) {
            console.error("Error loading next event:", error);
            // Show empty state on error too
            const trans = t(); // Ensure trans is available in catch block
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                    <i data-lucide="calendar-x" class="w-8 h-8 text-purple-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">${trans.dashboard.emptyNextEventTitle}</h3>
                <p class="text-gray-400 text-sm mb-4 text-center">${trans.dashboard.emptyNextEventDesc}</p>
                <a href="planner.html" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>${trans.dashboard.emptyNextEventAction}</span>
                </a>
            </div>
        `;
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
        }
    });
}
/**
 * Main function to load all dashboard data
 * Loads habits, subjects, pomodoro, objectives, and analytics in parallel
 */
function loadDashboard() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const loadingEl = document.getElementById("dashboard-content");
        if (loadingEl) {
            loadingEl.innerHTML = '<p class="loading">Cargando datos del dashboard...</p>';
        }
        try {
            // Sync language preference from backend before rendering data
            try {
                const user = yield getCurrentUser();
                const backendLang = user.language || ((_a = user.preferences) === null || _a === void 0 ? void 0 : _a.language);
                if (backendLang && backendLang !== getCurrentLanguage()) {
                    setCurrentLanguage(backendLang);
                    applyTranslations();
                }
            }
            catch (e) { /* ignore language sync errors */ }
            localizeConcentrationToasts();
            // Localize static pomodoro tagline
            const tagline = document.getElementById('pomodoroTagline');
            if (tagline) {
                const lang = getCurrentLanguage();
                const map = {
                    es: 'Define tu ritmo. Domina tu tiempo.',
                    en: 'Set your rhythm. Master your time.',
                    zh: '设定你的节奏，掌控你的时间。',
                    pt: 'Defina seu ritmo. Domine seu tempo.',
                };
                tagline.textContent = map[lang] || map.es;
            }
            // Load all data in parallel
            yield Promise.all([
                loadHabitsStats(),
                loadSubjectsStats(),
                loadPomodoroStats(),
                loadWeeklyObjectives(),
                loadWeeklyChallenge(),
                loadWeeklyStudyRhythm(),
                loadFocusDistribution(),
                loadPeakProductivity(),
                loadKeyHabits(),
                loadNextEvent()
            ]);
            // Hide loading state on success
            if (loadingEl) {
                loadingEl.style.display = "none";
            }
        }
        catch (error) {
            console.error("Error loading dashboard:", error);
            // Show error message to user
            if (loadingEl) {
                loadingEl.innerHTML = '<p class="error-state">Error al cargar el dashboard. Por favor, recargá la página.</p>';
            }
        }
    });
}
/**
 * Initialize dashboard when DOM is ready
 * Loads initial data and binds event listeners for all UI interactions
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Initialize confirmation modal
        initConfirmModal();
        // Load dashboard data
        loadDashboard();
        // Bind add objective button
        const addBtn = document.getElementById('addObjectiveBtn');
        if (addBtn) {
            addBtn.addEventListener('click', addObjective);
        }
        // Bind objective modal close buttons
        const closeModalBtn = document.getElementById('closeObjectiveModalBtn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', closeObjectiveModal);
        }
        const cancelBtn = document.getElementById('cancelObjectiveBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeObjectiveModal);
        }
        // Bind objective form submit
        const objectiveForm = document.getElementById('objectiveForm');
        if (objectiveForm) {
            objectiveForm.addEventListener('submit', submitObjectiveForm);
        }
        // Close modal on background click
        const modal = document.getElementById('objectiveModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeObjectiveModal();
                }
            });
        }
    });
}
else {
    // DOM already loaded, execute immediately
    loadDashboard();
    loadWeeklyChallenge();
    // --- Llamar al inicializar ---
    initWeeklyObjectivesFilters();
    loadWeeklyObjectives();
    const addBtn = document.getElementById('addObjectiveBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addObjective);
    }
    const closeModalBtn = document.getElementById('closeObjectiveModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeObjectiveModal);
    }
    const cancelBtn = document.getElementById('cancelObjectiveBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeObjectiveModal);
    }
    const objectiveForm = document.getElementById('objectiveForm');
    if (objectiveForm) {
        objectiveForm.addEventListener('submit', submitObjectiveForm);
    }
    const modal = document.getElementById('objectiveModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeObjectiveModal();
            }
        });
    }
} /**
 * ==========================================
 * Pomodoro Timer Functionality
 * ==========================================
 * Complete Pomodoro implementation with configurable timers,
 * session tracking, and productivity analytics
 */
(() => {
    // Default timer configuration
    const DEFAULTS = {
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLongBreak: 4,
    };
    // User settings (can be customized)
    let settings = Object.assign({}, DEFAULTS);
    // Timer state variables
    let timerInterval = null;
    let remainingSeconds = settings.workMinutes * 60;
    let currentStage = 'work';
    let isRunning = false;
    let completedCycles = 0; // kept for compatibility but MUST NOT be incremented manually
    // Latest stats received from backend - single source of truth for counters
    let latestPomodoroStats = { totalSessionsThisWeek: 0, sessionsToday: 0 };
    let sessionStart = null; // When current work session started
    let defaultSubjectId = null; // Default subject for sessions
    let beforeUnloadHandler = null;
    // Variables for handling timer when tab is in background
    let timerStartTime = null; // Timestamp when timer started
    let timerStartRemaining = 0; // Remaining seconds when timer started
    let visibilityHandler = null; // Handler for visibility changes
    // =====================
    // 🔊 Audio & Notifications
    // =====================
    let pomodoroAudio = null;
    let notificationPermissionRequested = false;
    // DOM elements
    const circle = document.getElementById('pomodoroProgressCircle');
    const timerDisplay = document.getElementById('pomodoroTimerDisplay');
    const stageLabel = document.getElementById('pomodoroStageLabel');
    const pomodorosCountEl = document.getElementById('pomodorosCount');
    const pomodoroSetLabelEl = document.getElementById('pomodoroSetLabel');
    const playBtn = document.getElementById('pomodoroPlayBtn');
    const skipBtn = document.getElementById('pomodoroSkipBtn');
    const resetBtn = document.getElementById('pomodoroResetBtn');
    const settingsBtn = document.getElementById('pomodoroSettingsBtn');
    // Onboarding Elements
    const onboardingTooltip = document.getElementById('pomodoroTooltip');
    const closeTooltipBtn = document.getElementById('closePomodoroTooltip');
    const modal = document.getElementById('pomodoroSettingsModal');
    const settingsForm = document.getElementById('pomodoroSettingsForm');
    const workInput = document.getElementById('workMinutes');
    const shortInput = document.getElementById('shortBreakMinutes');
    const longInput = document.getElementById('longBreakMinutes');
    const cyclesInput = document.getElementById('cyclesBeforeLongBreak');
    const subjectSelect = document.getElementById('pomodoroDefaultSubjectSelect');
    const modalCancel = document.getElementById('pomodoroSettingsCancel');
    // SVG circle circumference for progress calculation
    const CIRCLE_LENGTH = 552;
    // =====================
    // ✨ Onboarding Function
    // =====================
    function handleOnboarding() {
        if (!onboardingTooltip || localStorage.getItem('studyo_onboarding_done'))
            return;
        setTimeout(() => {
            if (!localStorage.getItem('studyo_onboarding_done')) {
                onboardingTooltip.classList.remove('hidden');
            }
        }, 2000);
        const dismissOnboarding = () => {
            onboardingTooltip.classList.add('hidden');
            localStorage.setItem('studyo_onboarding_done', 'true');
        };
        closeTooltipBtn === null || closeTooltipBtn === void 0 ? void 0 : closeTooltipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dismissOnboarding();
        });
        settingsBtn === null || settingsBtn === void 0 ? void 0 : settingsBtn.addEventListener('click', dismissOnboarding);
    }
    /**
     * Load user settings from localStorage
     */
    function loadSettings() {
        try {
            const raw = localStorage.getItem('pomodoroSettings');
            if (raw) {
                const parsed = JSON.parse(raw);
                settings = Object.assign(Object.assign({}, settings), parsed);
            }
        }
        catch (e) { /* ignore parsing errors */ }
    }
    function initPomodoroAudio() {
        if (pomodoroAudio)
            return;
        pomodoroAudio = new Audio('public/sounds/pomodoroSound.mp3');
        pomodoroAudio.volume = 0.8;
        // Unlock audio via user gesture
        pomodoroAudio.play()
            .then(() => {
            pomodoroAudio.pause();
            pomodoroAudio.currentTime = 0;
        })
            .catch(() => {
            // Normal: autoplay blocked until user interaction
        });
    }
    /**
     * Save current settings to localStorage
     */
    function saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    }
    /**
     * Format seconds into MM:SS format
     * @param seconds - Number of seconds to format
     * @returns Formatted time string
     */
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    /**
     * Update timer display and progress circle
     */
    function updateDisplay() {
        // Update time display
        if (timerDisplay)
            timerDisplay.textContent = formatTime(remainingSeconds);
        // Update stage label
        if (stageLabel) {
            // @ts-ignore
            const lang = getCurrentLanguage();
            const workMap = {
                es: 'Enfoque',
                en: 'Focus',
                zh: '专注',
                pt: 'Foco',
            };
            const shortMap = {
                es: 'Descanso corto',
                en: 'Short break',
                zh: '短休息',
                pt: 'Pausa curta',
            };
            const longMap = {
                es: 'Descanso largo',
                en: 'Long break',
                zh: '长休息',
                pt: 'Pausa longa',
            };
            if (currentStage === 'work')
                stageLabel.textContent = workMap[lang] || workMap.es;
            else if (currentStage === 'short_break')
                stageLabel.textContent = shortMap[lang] || shortMap.es;
            else
                stageLabel.textContent = longMap[lang] || longMap.es;
        }
        // Update progress circle
        if (circle) {
            const total = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
            const progress = Math.max(0, Math.min(1, 1 - remainingSeconds / total));
            const offset = Math.round(CIRCLE_LENGTH * (1 - progress));
            circle.style.strokeDashoffset = `${offset}`;
        }
        // Update pomodoro counters
        try {
            // @ts-ignore
            const lang = getCurrentLanguage();
            const pomodoroLabel = {
                es: 'Pomodoros',
                en: 'Pomodoros',
                zh: '番茄钟',
                pt: 'Pomodoros',
            };
            const setLabelTemplate = {
                es: 'Set: {current} / {total}',
                en: 'Set: {current} / {total}',
                zh: '组: {current} / {total}',
                pt: 'Conjunto: {current} / {total}',
            };
            // Counters are rendered from loadPomodoroStats(); do not derive from timer-local increments
            try {
                const stats = latestPomodoroStats;
                const total = stats.totalSessionsThisWeek || 0;
                if (pomodorosCountEl)
                    pomodorosCountEl.textContent = `${pomodoroLabel[lang] || pomodoroLabel.es}: ${total}`;
                if (pomodoroSetLabelEl) {
                    const cycles = Math.max(1, settings.cyclesBeforeLongBreak);
                    let inSet = total % cycles;
                    if (inSet === 0 && total > 0)
                        inSet = cycles;
                    const tpl = setLabelTemplate[lang] || setLabelTemplate.es;
                    pomodoroSetLabelEl.textContent = tpl.replace('{current}', String(inSet)).replace('{total}', String(cycles));
                }
            }
            catch (e) { /* ignore DOM issues */ }
        }
        catch (e) { /* ignore DOM issues */ }
    }
    // Listen for domain event when a pomodoro is completed
    document.addEventListener('pomodoro:completed', () => {
        try {
            // On completion, refresh stats and weekly challenge UI
            loadPomodoroStats().catch(e => console.warn('refresh stats failed', e));
            loadWeeklyChallenge().catch(e => console.warn('refresh weekly challenge failed', e));
        }
        catch (e) { /* ignore */ }
    });
    // Backwards-compatible: also listen to sessionsUpdated if dispatched
    document.addEventListener('pomodoro:sessionsUpdated', (ev) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b, _c, _d;
        try {
            const ce = ev;
            const total = Number((_b = (_a = ce.detail) === null || _a === void 0 ? void 0 : _a.totalSessionsThisWeek) !== null && _b !== void 0 ? _b : (_c = ce.detail) === null || _c === void 0 ? void 0 : _c.totalSessionsToday) || 0;
            // Compute current week key (YYYY-MM-DD) in user timezone
            let userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            try {
                const u = yield getCurrentUser();
                userTz = u.timezone || userTz;
            }
            catch (e) { }
            const wkStart = getStartOfWeekInUserTZ(userTz);
            const weekKey = wkStart.toISOString().slice(0, 10);
            // Read stored reset offset (per-week)
            const RESET_KEY = 'pomodoroReset';
            let stored = {};
            try {
                stored = JSON.parse(localStorage.getItem(RESET_KEY) || '{}');
            }
            catch (e) {
                stored = {};
            }
            // If stored reset is for another week, clear it
            if (stored.week !== weekKey) {
                stored = {};
                localStorage.removeItem(RESET_KEY);
            }
            const offset = Number(stored.offset || 0);
            const displayed = Math.max(0, total - offset);
            // Store the raw total and the displayed (offset-applied) value
            latestPomodoroStats.rawTotalSessionsThisWeek = total;
            latestPomodoroStats.totalSessionsThisWeek = displayed; // displayed = total - offset
            latestPomodoroStats.sessionsToday = ((_d = ce.detail) === null || _d === void 0 ? void 0 : _d.totalSessionsToday) || 0;
            completedCycles = displayed; // keep for compatibility
            updateDisplay();
        }
        catch (e) { /* ignore */ }
    }));
    /**
     * Play pomodoro completion sound
     */
    function playBeep() {
        if (!pomodoroAudio)
            return;
        try {
            pomodoroAudio.currentTime = 0;
            pomodoroAudio.play().catch(() => { });
        }
        catch (e) {
            console.warn('Audio not available', e);
        }
    }
    /**
     * Sync timer based on timestamps
     */
    function syncTimer() {
        if (!isRunning || timerStartTime === null)
            return;
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartTime) / 1000);
        const newRemaining = Math.max(0, timerStartRemaining - elapsed);
        if (newRemaining !== remainingSeconds) {
            remainingSeconds = newRemaining;
            updateDisplay();
        }
        if (remainingSeconds <= 0) {
            finishTimer();
        }
    }
    /**
     * Handle timer completion
     */
    function finishTimer() {
        return __awaiter(this, void 0, void 0, function* () {
            playBeep();
            if (document.visibilityState !== 'visible') {
                notifyPomodoroFinished();
            }
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }
            // Save session if work stage finished
            if (currentStage === 'work' && sessionStart) {
                const end = new Date();
                let durationMin = Math.round((end.getTime() - sessionStart.getTime()) / 60000);
                durationMin = Math.max(1, durationMin);
                try {
                    console.log('[finishTimer] Pomodoro finished - creating session', { start: sessionStart.toISOString(), end: end.toISOString(), duration: durationMin, subject: defaultSubjectId });
                    // @ts-ignore
                    const res = yield saveWorkSession(sessionStart, end, durationMin, defaultSubjectId);
                    console.log('[finishTimer] Pomodoro POST completed', res);
                }
                catch (err) {
                    console.error('[finishTimer] Error saving pomodoro session', err);
                }
                sessionStart = null;
            }
            // Advance stage
            advanceStage();
            // Restart automatically
            remainingSeconds = (currentStage === 'work' ? settings.workMinutes : currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes) * 60;
            timerStartTime = Date.now();
            timerStartRemaining = remainingSeconds;
            // If entering work stage, initialize sessionStart for next session
            if (currentStage === 'work' && !sessionStart) {
                console.log('[finishTimer] Entering work stage - initializing sessionStart');
                sessionStart = new Date();
            }
            timerInterval = window.setInterval(() => {
                syncTimer();
                if (remainingSeconds > 0)
                    remainingSeconds -= 1;
                if (remainingSeconds <= 0)
                    finishTimer();
                updateDisplay();
            }, 1000);
            updateDisplay();
        });
    }
    /**
     * Start the timer
     */
    function startTimer() {
        if (isRunning)
            return;
        isRunning = true;
        updatePlayButtonState();
        initPomodoroAudio();
        requestNotificationPermission();
        if (!sessionStart && currentStage === 'work')
            sessionStart = new Date();
        timerStartTime = Date.now();
        timerStartRemaining = remainingSeconds;
        beforeUnloadHandler = (e) => {
            e.preventDefault();
            // @ts-ignore
            const lang = getCurrentLanguage();
            const messages = {
                es: 'El Pomodoro se detendrá si abandonas esta página. ¿Estás seguro?',
                en: 'The Pomodoro will stop if you leave this page. Are you sure?',
                zh: '离开此页面将停止番茄钟，确定继续吗？',
                pt: 'O Pomodoro será interrompido se você sair desta página. Tem certeza?',
            };
            e.returnValue = messages[lang] || messages.es;
            return e.returnValue;
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        if (!visibilityHandler) {
            visibilityHandler = () => {
                if (!document.hidden && isRunning) {
                    syncTimer();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
        }
        timerInterval = window.setInterval(() => {
            syncTimer();
            if (remainingSeconds > 0)
                remainingSeconds -= 1;
            if (remainingSeconds <= 0)
                finishTimer();
            updateDisplay();
        }, 1000);
    }
    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
        timerStartTime = null;
        updatePlayButtonState();
        if (beforeUnloadHandler) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
    }
    function resetTimer(toStage = null) {
        pauseTimer();
        if (toStage)
            currentStage = toStage;
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        sessionStart = null;
        timerStartTime = null;
        timerStartRemaining = 0;
        updateDisplay();
    }
    function skipStage() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (currentStage === 'work' && sessionStart) {
            const end = new Date();
            const durationMin = Math.max(1, Math.round((end.getTime() - sessionStart.getTime()) / 60000));
            // @ts-ignore
            saveWorkSession(sessionStart, end, durationMin, defaultSubjectId).catch(err => console.error(err));
            sessionStart = null;
        }
        playBeep();
        isRunning = false;
        updatePlayButtonState();
        advanceStage();
    }
    function advanceStage() {
        if (currentStage === 'work') {
            if (completedCycles > 0 && completedCycles % settings.cyclesBeforeLongBreak === 0) {
                currentStage = 'long_break';
            }
            else {
                currentStage = 'short_break';
            }
        }
        else {
            currentStage = 'work';
        }
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        updateDisplay();
    }
    function requestNotificationPermission() {
        if (notificationPermissionRequested)
            return;
        notificationPermissionRequested = true;
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
    function notifyPomodoroFinished() {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('StudyO', {
                body: 'Pomodoro finalizado.¡Hora de un descanso!',
                silent: false,
            });
        }
    }
    function saveWorkSession(start, end, durationMin, subjectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = {
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    duration: durationMin,
                };
                if (subjectId !== null && !isNaN(subjectId)) {
                    payload.subject = Number(subjectId);
                }
                console.log('[saveWorkSession] Saving pomodoro:', payload);
                // @ts-ignore
                const result = yield apiPost('/pomodoro/', payload, true);
                console.log('[saveWorkSession] Pomodoro saved successfully', result);
                console.log('[saveWorkSession] Pomodoro POST sent');
                // Notify domain that a pomodoro has been completed
                try {
                    document.dispatchEvent(new CustomEvent('pomodoro:completed'));
                }
                catch (e) { /* ignore */ }
                // Also keep weekly challenge reload event for compatibility
                try {
                    document.dispatchEvent(new CustomEvent('weeklyChallenge:update'));
                }
                catch (e) { }
                // Refresh related UI (loadPomodoroStats will update counters)
                // @ts-ignore
                yield loadPomodoroStats().catch(e => console.warn('refresh stats failed', e));
                // @ts-ignore
                yield loadFocusDistribution().catch(e => console.warn('refresh distribution failed', e));
                // Defensive: ensure display is updated with fresh counters
                // loadPomodoroStats dispatches 'pomodoro:sessionsUpdated' which updates latestPomodoroStats,
                // but we explicitly call updateDisplay() again to guarantee UI sync even if event fails
                try {
                    updateDisplay();
                }
                catch (e) { /* ignore */ }
                return result;
            }
            catch (e) {
                console.error('Failed to save pomodoro session', e);
                throw e;
            }
        });
    }
    function loadSubjectsToSelect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!subjectSelect)
                return;
            try {
                // @ts-ignore
                const trans = t();
                // @ts-ignore
                const subjects = yield apiGet('/subjects/');
                subjectSelect.innerHTML =
                    `<option value="" data-i18n="dashboard.noPomodoroSubject">${trans.dashboard.noPomodoroSubject}</option>` +
                        subjects.map((s) => `<option value="${s.id}">${s.name}</option>`).join('');
                if (defaultSubjectId)
                    subjectSelect.value = defaultSubjectId.toString();
            }
            catch (e) {
                console.warn('Could not load subjects', e);
            }
        });
    }
    function updatePlayButtonState() {
        if (!playBtn)
            return;
        playBtn.innerHTML = isRunning ? '<i data-lucide="pause" class="w-5 h-5"></i>' : '<i data-lucide="play" class="w-5 h-5 ml-1"></i>';
        // @ts-ignore
        if (typeof lucide !== 'undefined')
            lucide.createIcons();
    }
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        handleOnboarding(); // Onboarding StudyO
        remainingSeconds = settings.workMinutes * 60;
        updateDisplay();
        if (playBtn)
            playBtn.addEventListener('click', () => { if (isRunning)
                pauseTimer();
            else
                startTimer(); });
        if (skipBtn)
            skipBtn.addEventListener('click', () => skipStage());
        if (resetBtn)
            resetBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
                try {
                    // Reset in-memory counters and timer UI
                    completedCycles = 0;
                    resetTimer('work');
                    updateDisplay();
                    // Persist a per-week reset offset so the counter shows zero
                    try {
                        // Fetch current weekly total
                        // @ts-ignore
                        const sessions = yield apiGet('/pomodoro/');
                        // Determine week start in user timezone
                        let userTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                        try {
                            const u = yield getCurrentUser();
                            userTz = u.timezone || userTz;
                        }
                        catch (e) { }
                        const wkStart = getStartOfWeekInUserTZ(userTz);
                        const weekKey = wkStart.toISOString().slice(0, 10);
                        const totalSessionsThisWeek = sessions.filter(s => new Date(s.start_time) >= wkStart).length;
                        const RESET_KEY = 'pomodoroReset';
                        const payload = { week: weekKey, offset: totalSessionsThisWeek };
                        localStorage.setItem(RESET_KEY, JSON.stringify(payload));
                        console.log('[reset] Stored reset offset', payload);
                        // Update UI
                        completedCycles = 0;
                        updateDisplay();
                        // Refresh stats and weekly challenge UI
                        // @ts-ignore
                        yield loadPomodoroStats();
                        try {
                            document.dispatchEvent(new CustomEvent('weeklyChallenge:update'));
                        }
                        catch (e) { }
                    }
                    catch (err) {
                        console.warn('Could not persist reset offset', err);
                    }
                }
                catch (e) {
                    console.error('Reset failed', e);
                }
            }));
        if (settingsBtn && modal) {
            settingsBtn.addEventListener('click', (e) => __awaiter(void 0, void 0, void 0, function* () {
                e.preventDefault();
                if (document.body.classList.contains('concentration-mode'))
                    return;
                if (workInput)
                    workInput.value = String(settings.workMinutes);
                if (shortInput)
                    shortInput.value = String(settings.shortBreakMinutes);
                if (longInput)
                    longInput.value = String(settings.longBreakMinutes);
                if (cyclesInput)
                    cyclesInput.value = String(settings.cyclesBeforeLongBreak);
                yield loadSubjectsToSelect();
                modal.style.display = 'flex';
                // @ts-ignore
                if (typeof lucide !== 'undefined')
                    setTimeout(() => lucide.createIcons(), 10);
            }));
        }
        if (modalCancel && modal)
            modalCancel.addEventListener('click', () => { modal.style.display = 'none'; });
        const closeBtn = document.getElementById('pomodoroSettingsCloseBtn');
        if (closeBtn && modal)
            closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal)
                    modal.style.display = 'none';
            });
        }
        if (settingsForm && modal)
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const wm = Number((workInput && workInput.value) || settings.workMinutes);
                const sb = Number((shortInput && shortInput.value) || settings.shortBreakMinutes);
                const lb = Number((longInput && longInput.value) || settings.longBreakMinutes);
                const cb = Number((cyclesInput && cyclesInput.value) || settings.cyclesBeforeLongBreak);
                settings.workMinutes = Math.max(1, wm);
                settings.shortBreakMinutes = Math.max(1, sb);
                settings.longBreakMinutes = Math.max(1, lb);
                settings.cyclesBeforeLongBreak = Math.max(1, cb);
                const sel = subjectSelect ? subjectSelect.value : '';
                defaultSubjectId = sel ? Number(sel) : null;
                saveSettings();
                if (!isRunning)
                    resetTimer('work');
                modal.style.display = 'none';
                updateDisplay();
            });
        loadSubjectsToSelect();
    });
})();
