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
import { apiGet, apiPost, apiDelete, apiPut, getToken, getEvents } from "./api.js";
import { initConfirmModal, showConfirmModal, showAlertModal } from "./confirmModal.js";
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
/**
 * Loads and displays weekly objectives/goals on the dashboard
 * Fetches all objectives from API and renders them in a container
 * Supports inline editing of icon and area, as well as delete functionality
 */
function loadWeeklyObjectives() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch weekly objectives from API
            const objectives = yield apiGet("/weekly-objectives/"); // Wait for API response
            const container = document.getElementById("weeklyObjectivesContainer");
            if (!container)
                return;
            // Store in localStorage for offline reference
            localStorage.setItem('weeklyObjectives', JSON.stringify(objectives));
            // Display empty state when no objectives exist
            if (objectives.length === 0) { // If objectives array is empty, user has no weekly objectives
                container.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center animate-fade animated">
                    
                    <div class="relative mb-5 group cursor-pointer" onclick="document.getElementById('addObjectiveBtn').click()">
                        <div class="absolute inset-0 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all duration-500"></div>
                        <div class="relative w-20 h-20 bg-[#1a1d26] rounded-full flex items-center justify-center border border-gray-800 group-hover:border-purple-500/50 group-hover:scale-105 transition-all duration-300 shadow-xl">
                            <i data-lucide="crosshair" class="w-10 h-10 text-gray-500 group-hover:text-purple-400 transition-colors duration-300"></i>
                        </div>
                    </div>

                    <h3 class="text-xl font-bold text-white mb-2 tracking-tight">
                        Sin objetivos estratégicos
                    </h3>
                    
                    <p class="text-gray-500 text-sm max-w-[280px] mx-auto leading-relaxed mb-6">
                        La semana te domina si no tienes un plan. <br>
                        <span class="text-purple-400/80">Define tu primera victoria ahora.</span>
                    </p>

                    <div class="animate-bounce text-gray-700">
                        <i data-lucide="arrow-down" class="w-5 h-5"></i>
                    </div>
                </div>
            `;
            }
            else {
                // Render objectives when data exists
                container.innerHTML = objectives.map(obj => {
                    // Priority color configuration for visual distinction
                    const priorityMap = {
                        1: { name: 'MÁXIMA PRIORIDAD', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
                        2: { name: 'EXPLORACIÓN CLAVE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
                        3: { name: 'COMPLEMENTARIO', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
                    };
                    const priorityConfig = priorityMap[obj.priority || 2] || priorityMap[2];
                    // Use stored data or fallback defaults
                    const displayIcon = obj.icon || '⚡'; // Default icon
                    const displayArea = obj.area || 'General'; // Default category label
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
                                    <button class="edit-objective p-1.5 rounded-lg text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 transition-all duration-200" data-id="${obj.id}" title="Editar">
                                        <i data-lucide="edit-3" class="w-4 h-4"></i>
                                    </button>
                                    <button class="delete-objective p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200" data-id="${obj.id}" title="Eliminar">
                                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    </button>
                                </div>
                            </div>

                            <div class="text-white text-base font-semibold mb-2 leading-snug">
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
                                if (submitBtn)
                                    submitBtn.textContent = 'Actualizar Objetivo';
                                // Store objective ID for edit mode
                                window.editingObjectiveId = objId;
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
                                if (submitBtn)
                                    submitBtn.textContent = 'Actualizar Objetivo';
                                // Store objective ID for edit mode
                                window.editingObjectiveId = objId;
                                // Show modal
                                const modal = document.getElementById('objectiveModal');
                                if (modal)
                                    modal.style.display = 'flex';
                            }
                        }
                    }));
                });
            }
            // Important: Render icons for newly injected content (if library is available)
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
        }
        catch (error) {
            console.error("Error loading weekly objectives:", error); // Error handling: displays error when loading objectives
        }
    });
}
/**
 * Deletes a weekly objective after user confirmation
 * @param id - The ID of the objective to delete
 */
function deleteObjective(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const confirmed = yield showConfirmModal('¿Estás seguro de que deseas eliminar este objetivo? Esta acción no se puede deshacer.', 'Eliminar Objetivo');
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
                subjectSelect.innerHTML = '<option value="">-- Ninguna materia --</option>' +
                    subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            }
        }
        catch (e) {
            console.warn('Could not load subjects for objective modal', e);
        }
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
    // Restore button text to "Save"
    const submitBtn = document.getElementById('submitObjectiveBtn');
    if (submitBtn)
        submitBtn.textContent = 'Guardar Objetivo';
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
            loadWeeklyObjectives();
        }
        catch (error) {
            console.error("Error creating/updating objective:", error);
            alert('Error al guardar el objetivo');
        }
    });
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
            // Get today's date at midnight for filtering
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            // Filter sessions from today
            const todaySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                sessionDate.setHours(0, 0, 0, 0);
                return sessionDate.getTime() === today.getTime();
            });
            // Calculate today's statistics
            const totalMinutesToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
            const totalSessionsToday = todaySessions.length;
            // Update statistics display
            const sessionsTodayEl = document.getElementById("sessions-today");
            const minutesTodayEl = document.getElementById("minutes-today");
            if (sessionsTodayEl)
                sessionsTodayEl.textContent = totalSessionsToday.toString();
            if (minutesTodayEl)
                minutesTodayEl.textContent = totalMinutesToday.toString();
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
/**
 * Loads and displays weekly study rhythm based on Pomodoro sessions
 * Creates a line chart showing study time for each day of the week
 */
function loadWeeklyStudyRhythm() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all Pomodoro sessions
            const sessions = yield apiGet("/pomodoro/");
            // Get sessions from the past week
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weeklySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                return sessionDate >= weekAgo;
            });
            // Group minutes by day of week (0 = Sunday, 1 = Monday, etc.)
            const dayMinutes = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
            weeklySessions.forEach(session => {
                const sessionDate = new Date(session.start_time);
                const dayOfWeek = sessionDate.getDay();
                dayMinutes[dayOfWeek] += session.duration;
            });
            // Convert to array for chart (Monday to Sunday)
            const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
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
                // Show empty state if no sessions this week
                if (weeklySessions.length === 0) {
                    chartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="bar-chart-2" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">Aún no hay sesiones de Pomodoro esta semana</p>
                        <p class="text-gray-600 text-xs text-center mt-1">Completá algunas sesiones para ver tu ritmo de estudio</p>
                    </div>
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
                const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
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
        try {
            // Fetch sessions and subjects
            const sessions = yield apiGet("/pomodoro/");
            const subjects = yield apiGet("/subjects/");
            console.log('All sessions:', sessions);
            console.log('All subjects:', subjects);
            // Get sessions from the past week
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weeklySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                return sessionDate >= weekAgo;
            });
            // Group minutes by subject
            const subjectMinutes = {};
            let totalMinutes = 0;
            weeklySessions.forEach(session => {
                // Debug: see what's incoming
                console.log('Session:', session, 'Subject ID:', session.subject, 'Type:', typeof session.subject);
                // Subject may be number, null, or undefined
                let subjectId = null;
                if (session.subject !== null && session.subject !== undefined) {
                    // Convert to number if string
                    subjectId = typeof session.subject === 'string' ? parseInt(session.subject) : session.subject;
                }
                // Use special key for "no subject" that won't collide with real IDs
                const key = subjectId !== null && !isNaN(subjectId) ? subjectId : -1;
                if (!subjectMinutes[key]) {
                    subjectMinutes[key] = 0;
                }
                subjectMinutes[key] += session.duration;
                totalMinutes += session.duration;
            });
            console.log('Subject minutes:', subjectMinutes);
            console.log('Total minutes:', totalMinutes);
            // Create array of subjects with minutes (only those with real ID and study time)
            const subjectData = subjects
                .filter(s => subjectMinutes[s.id] && subjectMinutes[s.id] > 0)
                .map(s => ({
                id: s.id,
                name: s.name,
                minutes: subjectMinutes[s.id],
                percentage: totalMinutes > 0 ? (subjectMinutes[s.id] / totalMinutes) * 100 : 0
            }))
                .sort((a, b) => b.minutes - a.minutes);
            // Add "no subject" sessions if any
            if (subjectMinutes[-1] && subjectMinutes[-1] > 0) {
                subjectData.push({
                    id: -1,
                    name: 'Sin materia',
                    minutes: subjectMinutes[-1],
                    percentage: totalMinutes > 0 ? (subjectMinutes[-1] / totalMinutes) * 100 : 0
                });
            }
            // Colors for the chart
            const colors = ['#a855f7', '#60a5fa', '#34d399', '#fbbf24', '#ec4899', '#8b5cf6'];
            // Generate conic gradient
            let conicGradient = '';
            let currentPercent = 0;
            subjectData.forEach((subject, index) => {
                const color = colors[index % colors.length];
                const startPercent = currentPercent;
                const endPercent = currentPercent + subject.percentage;
                conicGradient += `${color} ${startPercent}% ${endPercent}%, `;
                currentPercent = endPercent;
            });
            // Update distribution chart
            const pieChart = document.getElementById('focus-distribution-chart');
            const pieChartParent = pieChart === null || pieChart === void 0 ? void 0 : pieChart.parentElement;
            if (pieChart && pieChartParent) {
                // Show empty state if no data
                if (weeklySessions.length === 0 || subjectData.length === 0) {
                    pieChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">Aún no hay sesiones de Pomodoro</p>
                        <p class="text-gray-600 text-xs text-center mt-1">Completá sesiones para ver la distribución</p>
                    </div>
                `;
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
                    return;
                }
                // Apply conic gradient to pie chart
                pieChart.style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
                // Update total hours display
                const totalHoursEl = document.getElementById('focus-total-hours');
                if (totalHoursEl) {
                    if (totalMinutes < 60) {
                        totalHoursEl.textContent = `${totalMinutes}m`;
                    }
                    else {
                        const hours = Math.floor(totalMinutes / 60);
                        const mins = totalMinutes % 60;
                        if (mins === 0) {
                            totalHoursEl.textContent = `${hours}h`;
                        }
                        else {
                            totalHoursEl.textContent = `${hours}h ${mins}m`;
                        }
                    }
                }
                // Update legend
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
/**
 * Loads and displays peak productivity time
 * Analyzes 4 weeks of Pomodoro data to determine best time for focus
 */
function loadPeakProductivity() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch all Pomodoro sessions
            const sessions = yield apiGet("/pomodoro/");
            // Get sessions from past 4 weeks
            const today = new Date();
            const fourWeeksAgo = new Date(today);
            fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
            // Defensive: only consider sessions with valid start_time and positive duration,
            // and ignore any sessions scheduled in the future.
            const recentSessions = sessions.filter(s => {
                if (!s || !s.start_time || typeof s.duration !== 'number')
                    return false;
                const sessionDate = new Date(s.start_time);
                if (isNaN(sessionDate.getTime()))
                    return false;
                if (sessionDate > new Date())
                    return false; // ignore future sessions
                if (s.duration <= 0)
                    return false; // ignore zero/negative durations
                return sessionDate >= fourWeeksAgo;
            });
            // If no valid sessions, show message and exit
            if (recentSessions.length === 0) {
                const peakEl = document.getElementById('peak-productivity-time');
                if (peakEl) {
                    peakEl.textContent = 'No hay datos suficientes';
                }
                const descriptionEl = document.getElementById('peak-productivity-desc');
                if (descriptionEl) {
                    descriptionEl.textContent = 'Completá algunas sesiones de Pomodoro para descubrir tu momento peak de productividad.';
                }
                return;
            }
            // Require a minimum amount of real data to report a peak.
            // Heuristics: at least 3 sessions and at least 60 minutes total across the window.
            const totalMinutes = recentSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
            if (recentSessions.length < 3 || totalMinutes < 60) {
                const peakEl = document.getElementById('peak-productivity-time');
                if (peakEl)
                    peakEl.textContent = 'No hay datos suficientes';
                const descriptionEl = document.getElementById('peak-productivity-desc');
                if (descriptionEl)
                    descriptionEl.textContent = 'Completá algunas sesiones de Pomodoro para descubrir tu momento peak de productividad.';
                return;
            }
            // Group sessions by weekday and hour to find the (weekday, hour) with most minutes
            const dayHourMinutes = {};
            recentSessions.forEach(session => {
                const sessionDate = new Date(session.start_time);
                const day = sessionDate.getDay(); // 0-6
                const hour = sessionDate.getHours(); // 0-23
                const key = `${day}-${hour}`;
                if (!dayHourMinutes[key])
                    dayHourMinutes[key] = 0;
                dayHourMinutes[key] += session.duration;
            });
            // Find best day-hour combo
            let bestDay = -1;
            let bestHour = -1;
            let maxMinutes = 0;
            Object.keys(dayHourMinutes).forEach(k => {
                const minutes = dayHourMinutes[k];
                if (minutes > maxMinutes) {
                    maxMinutes = minutes;
                    const parts = k.split('-').map(p => parseInt(p, 10));
                    bestDay = parts[0];
                    bestHour = parts[1];
                }
            });
            // If nothing meaningful found, show no-data state
            if (bestDay === -1 || bestHour === -1 || maxMinutes === 0) {
                const peakEl = document.getElementById('peak-productivity-time');
                if (peakEl)
                    peakEl.textContent = 'No hay datos suficientes';
                const descriptionEl = document.getElementById('peak-productivity-desc');
                if (descriptionEl)
                    descriptionEl.textContent = 'Completá algunas sesiones de Pomodoro para descubrir tu momento peak de productividad.';
                return;
            }
            // Calculate 3-hour window around peak (1 hour before, peak, 1 hour after)
            const startHour = Math.max(0, bestHour - 1);
            const endHour = Math.min(23, bestHour + 1);
            // Format hour for display
            const formatHour = (h) => `${h.toString().padStart(2, '0')}:00`;
            const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const bestDayName = dayNames[bestDay] || '—';
            // Update UI with peak productivity info (based only on real sessions)
            const peakEl = document.getElementById('peak-productivity-time');
            if (peakEl) {
                peakEl.textContent = `${bestDayName}, ${formatHour(startHour)} - ${formatHour(endHour)}`;
            }
            const descriptionEl = document.getElementById('peak-productivity-desc');
            if (descriptionEl) {
                descriptionEl.innerHTML = `
                Datos de las últimas 4 semanas indican que esta es tu franja de máxima concentración. 
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">¡Aprovechala al máximo para tareas complejas!</span>
            `;
            }
        }
        catch (error) {
            console.error("Error loading peak productivity:", error);
        }
    });
}
/**
 * Loads and displays weekly balance review
 * Shows distribution of study time among top 3 subjects
 */
function loadWeeklyBalance() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Fetch sessions and subjects
            const sessions = yield apiGet("/pomodoro/");
            const subjects = yield apiGet("/subjects/");
            // Get sessions from the past week
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const weeklySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                return sessionDate >= weekAgo;
            });
            // Group minutes by subject
            const subjectMinutes = {};
            let totalMinutes = 0;
            weeklySessions.forEach(session => {
                const subjectId = session.subject || 0;
                if (!subjectMinutes[subjectId]) {
                    subjectMinutes[subjectId] = 0;
                }
                subjectMinutes[subjectId] += session.duration;
                totalMinutes += session.duration;
            });
            // Get top 3 subjects by study time
            const topSubjects = subjects
                .filter(s => subjectMinutes[s.id])
                .map(s => ({
                id: s.id,
                name: s.name,
                minutes: subjectMinutes[s.id],
                percentage: (subjectMinutes[s.id] / totalMinutes) * 100
            }))
                .sort((a, b) => b.minutes - a.minutes)
                .slice(0, 3);
            // Colors for the chart
            const colors = ['#c084fc', '#fbbf24', '#34d399'];
            // Generate conic gradient
            let conicGradient = '';
            let currentPercent = 0;
            topSubjects.forEach((subject, index) => {
                const color = colors[index % colors.length];
                const startPercent = currentPercent;
                const endPercent = currentPercent + subject.percentage;
                conicGradient += `${color} ${startPercent}% ${endPercent}%, `;
                currentPercent = endPercent;
            });
            // Update balance chart
            const balanceChart = document.getElementById('weekly-balance-chart');
            const balanceChartParent = balanceChart === null || balanceChart === void 0 ? void 0 : balanceChart.parentElement;
            if (balanceChart && balanceChartParent) {
                // Show empty state if no data
                if (weeklySessions.length === 0 || topSubjects.length === 0) {
                    balanceChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-10 h-10 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-xs text-center">Aún no hay sesiones esta semana</p>
                        <p class="text-gray-600 text-[10px] text-center mt-1">Completá sesiones para ver el balance</p>
                    </div>
                `;
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
                    return;
                }
                // Apply conic gradient
                balanceChart.style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
                // Update total hours display
                const totalHoursEl = document.getElementById('weekly-balance-hours');
                if (totalHoursEl) {
                    const totalHours = Math.round(totalMinutes / 60);
                    totalHoursEl.textContent = `${totalHours}h`;
                }
            }
        }
        catch (error) {
            console.error("Error loading weekly balance:", error);
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
                    <p class="text-sm">No tenés hábitos clave configurados aún.</p>
                    <p class="text-xs mt-1">Marcá algunos hábitos como clave en la página de hábitos.</p>
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
                            Racha: ${habit.streak}
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
/**
 * Load and display the next upcoming event
 */
function loadNextEvent() {
    return __awaiter(this, void 0, void 0, function* () {
        const container = document.getElementById('nextEventContainer');
        if (!container)
            return;
        try {
            const events = yield getEvents();
            // Filter events that are today or in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const upcomingEvents = events
                .filter(event => {
                const eventDate = new Date(event.date);
                eventDate.setHours(0, 0, 0, 0);
                return eventDate >= today;
            })
                .sort((a, b) => {
                // Sort by date, then by start time
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
                    <h3 class="text-lg font-bold text-white mb-2">No hay eventos próximos</h3>
                    <p class="text-gray-400 text-sm mb-4 text-center">Organizá tu tiempo creando eventos en el planificador.</p>
                    <a href="planner.html" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>Crear mi primer evento</span>
                    </a>
                </div>
            `;
                if (typeof lucide !== 'undefined')
                    lucide.createIcons();
                return;
            }
            const nextEvent = upcomingEvents[0];
            const eventDate = new Date(nextEvent.date);
            const startTime = nextEvent.start_time.substring(0, 5);
            const endTime = nextEvent.end_time.substring(0, 5);
            // Get event type display name
            const typeNames = {
                1: 'Bloque de Estudio',
                2: 'Examen',
                3: 'Tarea Importante',
                4: 'Personal'
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
                            <span>${formatDate(nextEvent.date)}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                            <span>${startTime} - ${endTime}</span>
                        </div>
                    </div>
                    ${nextEvent.notes ? `<p class="text-sm text-gray-500 mt-2">${nextEvent.notes}</p>` : ''}
                </div>
                <a href="planner.html" class="block text-center text-sm text-purple-400 hover:text-purple-300 transition-colors">
                    Ver todos los eventos →
                </a>
            </div>
        `;
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
        }
        catch (error) {
            console.error("Error loading next event:", error);
            // Show empty state on error too
            container.innerHTML = `
            <div class="flex flex-col items-center justify-center py-8">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                    <i data-lucide="calendar-x" class="w-8 h-8 text-purple-400"></i>
                </div>
                <h3 class="text-lg font-bold text-white mb-2">No hay eventos próximos</h3>
                <p class="text-gray-400 text-sm mb-4 text-center">Organizá tu tiempo creando eventos en el planificador.</p>
                <a href="planner.html" class="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 text-purple-400 text-sm hover:from-purple-500/30 hover:via-pink-500/30 hover:to-purple-500/30 transition-all border border-purple-500/30 inline-flex items-center gap-2">
                    <i data-lucide="plus" class="w-4 h-4"></i>
                    <span>Crear mi primer evento</span>
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
        const loadingEl = document.getElementById("dashboard-content");
        if (loadingEl) {
            loadingEl.innerHTML = '<p class="loading">Cargando datos del dashboard...</p>';
        }
        try {
            // Load all data in parallel
            yield Promise.all([
                loadHabitsStats(),
                loadSubjectsStats(),
                loadPomodoroStats(),
                loadWeeklyObjectives(),
                loadWeeklyStudyRhythm(),
                loadFocusDistribution(),
                loadPeakProductivity(),
                loadWeeklyBalance(),
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
}
/**
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
    let completedCycles = 0; // Number of work sessions completed in current set
    let sessionStart = null; // When current work session started
    let defaultSubjectId = null; // Default subject for sessions
    let beforeUnloadHandler = null;
    // Variables for handling timer when tab is in background
    let timerStartTime = null; // Timestamp when timer started
    let timerStartRemaining = 0; // Remaining seconds when timer started
    let visibilityHandler = null; // Handler for visibility changes
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
            if (currentStage === 'work')
                stageLabel.textContent = 'Enfoque';
            else if (currentStage === 'short_break')
                stageLabel.textContent = 'Descanso corto';
            else
                stageLabel.textContent = 'Descanso largo';
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
            if (pomodorosCountEl)
                pomodorosCountEl.textContent = `Pomodoros: ${completedCycles}`;
            if (pomodoroSetLabelEl) {
                const cycles = Math.max(1, settings.cyclesBeforeLongBreak);
                let inSet = completedCycles % cycles;
                if (inSet === 0 && completedCycles > 0)
                    inSet = cycles;
                pomodoroSetLabelEl.textContent = `Set: ${inSet} / ${cycles}`;
            }
        }
        catch (e) { /* ignore DOM issues */ }
    }
    /**
     * Play beep sound on timer completion
     */
    function playBeep() {
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const o = ctx.createOscillator();
            const g = ctx.createGain();
            o.type = 'sine';
            o.frequency.value = 880;
            o.connect(g);
            g.connect(ctx.destination);
            g.gain.setValueAtTime(0.0001, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
            o.start();
            setTimeout(() => {
                g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
                setTimeout(() => { try {
                    o.stop();
                    ctx.close();
                }
                catch (e) { } }, 200);
            }, 150);
        }
        catch (e) {
            console.warn('Audio not available', e);
        }
    }
    /**
     * Sync timer based on timestamps (useful when tab comes back into focus)
     */
    function syncTimer() {
        if (!isRunning || timerStartTime === null)
            return;
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartTime) / 1000); // Elapsed seconds
        const newRemaining = Math.max(0, timerStartRemaining - elapsed);
        if (newRemaining !== remainingSeconds) {
            remainingSeconds = newRemaining;
            updateDisplay();
        }
        // If timer finished while tab was inactive
        if (remainingSeconds <= 0) {
            finishTimer();
        }
    }
    /**
     * Handle timer completion
     */
    function finishTimer() {
        playBeep();
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
        timerStartTime = null;
        // Remove navigation warning when timer stops
        if (beforeUnloadHandler) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
        // Save session if work stage finished
        if (currentStage === 'work' && sessionStart) {
            const end = new Date();
            const durationMin = Math.round((end.getTime() - sessionStart.getTime()) / 60000);
            saveWorkSession(sessionStart, end, durationMin, defaultSubjectId).catch(err => console.error('Error saving pomodoro session', err));
            sessionStart = null;
            completedCycles += 1;
        }
        // Advance to next stage
        advanceStage();
    }
    /**
     * Start the timer
     */
    function startTimer() {
        if (isRunning)
            return;
        isRunning = true;
        updatePlayButtonState();
        if (!sessionStart && currentStage === 'work')
            sessionStart = new Date();
        // Save start timestamp for sync
        timerStartTime = Date.now();
        timerStartRemaining = remainingSeconds;
        // Add navigation warning
        beforeUnloadHandler = (e) => {
            e.preventDefault();
            e.returnValue = 'El Pomodoro se detendrá si abandonas esta página. ¿Estás seguro?';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        // Add listener for tab visibility changes
        if (!visibilityHandler) {
            visibilityHandler = () => {
                if (!document.hidden && isRunning) {
                    // Sync timer when tab comes back into focus
                    syncTimer();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
        }
        // Start timer loop
        timerInterval = window.setInterval(() => {
            // Periodic sync
            syncTimer();
            // Also decrement normally
            if (remainingSeconds > 0) {
                remainingSeconds -= 1;
            }
            if (remainingSeconds <= 0) {
                finishTimer();
            }
            updateDisplay();
        }, 1000);
    }
    /**
     * Pause the timer
     */
    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
        timerStartTime = null;
        updatePlayButtonState();
        // Remove navigation warning
        if (beforeUnloadHandler) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
    }
    /**
     * Reset timer to initial value for current stage
     * @param toStage - Optional stage to reset to
     */
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
    /**
     * Skip to next stage immediately
     */
    function skipStage() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        // Save incomplete work session if in work stage
        if (currentStage === 'work' && sessionStart) {
            const end = new Date();
            const durationMin = Math.max(1, Math.round((end.getTime() - sessionStart.getTime()) / 60000));
            saveWorkSession(sessionStart, end, durationMin, defaultSubjectId).catch(err => console.error('Error saving pomodoro session', err));
            sessionStart = null;
            completedCycles += 1;
        }
        playBeep();
        isRunning = false;
        updatePlayButtonState();
        advanceStage();
    }
    /**
     * Advance to next stage (work -> break -> work, etc.)
     */
    function advanceStage() {
        if (currentStage === 'work') {
            // Decide break type based on completed cycles
            if (completedCycles > 0 && completedCycles % settings.cyclesBeforeLongBreak === 0) {
                currentStage = 'long_break';
            }
            else {
                currentStage = 'short_break';
            }
        }
        else {
            // From break return to work
            currentStage = 'work';
        }
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        updateDisplay();
    }
    /**
     * Save completed work session to API
     * @param start - Session start time
     * @param end - Session end time
     * @param durationMin - Duration in minutes
     * @param subjectId - Optional subject ID for session
     */
    function saveWorkSession(start, end, durationMin, subjectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = {
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    duration: durationMin,
                };
                // Ensure valid subject ID
                if (subjectId !== null && subjectId !== undefined && !isNaN(subjectId)) {
                    payload.subject = Number(subjectId);
                }
                console.log('Saving pomodoro session with payload:', payload);
                const response = yield apiPost('/pomodoro/', payload, true);
                console.log('Pomodoro session saved:', response);
                // Refresh stats
                loadPomodoroStats().catch(e => console.warn('refresh pomodoro stats failed', e));
                loadFocusDistribution().catch(e => console.warn('refresh focus distribution failed', e));
            }
            catch (e) {
                console.error('Failed to save pomodoro session', e);
            }
        });
    }
    /**
     * Load available subjects into select dropdown
     */
    function loadSubjectsToSelect() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!subjectSelect)
                return;
            try {
                const subjects = yield apiGet('/subjects/');
                subjectSelect.innerHTML = '<option value="">-- Ninguna --</option>' + subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
                if (defaultSubjectId)
                    subjectSelect.value = defaultSubjectId.toString();
            }
            catch (e) {
                console.warn('Could not load subjects for pomodoro select', e);
            }
        });
    }
    /**
     * Update play button icon based on timer state
     */
    function updatePlayButtonState() {
        if (!playBtn)
            return;
        if (isRunning) {
            // Show pause icon when running
            playBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
        }
        else {
            // Show play icon when stopped
            playBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 ml-1"></i>';
        }
        // Render icons
        if (typeof lucide !== 'undefined')
            lucide.createIcons();
    }
    /**
     * Initialize Pomodoro timer when DOM is ready
     */
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        // Apply initial settings
        remainingSeconds = settings.workMinutes * 60;
        updateDisplay();
        // Bind control buttons
        if (playBtn)
            playBtn.addEventListener('click', () => {
                if (isRunning)
                    pauseTimer();
                else
                    startTimer();
            });
        if (skipBtn)
            skipBtn.addEventListener('click', () => skipStage());
        if (resetBtn)
            resetBtn.addEventListener('click', () => {
                completedCycles = 0;
                resetTimer('work');
                updateDisplay();
            });
        // Settings modal
        if (settingsBtn && modal) {
            settingsBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
                // Populate form fields with current settings
                if (workInput)
                    workInput.value = String(settings.workMinutes);
                if (shortInput)
                    shortInput.value = String(settings.shortBreakMinutes);
                if (longInput)
                    longInput.value = String(settings.longBreakMinutes);
                if (cyclesInput)
                    cyclesInput.value = String(settings.cyclesBeforeLongBreak);
                yield loadSubjectsToSelect();
                if (modal)
                    modal.style.display = 'flex';
            }));
        }
        // Close modal button
        if (modalCancel && modal)
            modalCancel.addEventListener('click', () => { if (modal)
                modal.style.display = 'none'; });
        // Settings form submission
        if (settingsForm && modal)
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Read form values
                const wm = Number((workInput && workInput.value) || settings.workMinutes);
                const sb = Number((shortInput && shortInput.value) || settings.shortBreakMinutes);
                const lb = Number((longInput && longInput.value) || settings.longBreakMinutes);
                const cb = Number((cyclesInput && cyclesInput.value) || settings.cyclesBeforeLongBreak);
                // Validate and update settings
                settings.workMinutes = Math.max(1, wm);
                settings.shortBreakMinutes = Math.max(1, sb);
                settings.longBreakMinutes = Math.max(1, lb);
                settings.cyclesBeforeLongBreak = Math.max(1, cb);
                // Get selected subject
                const sel = subjectSelect ? subjectSelect.value : '';
                defaultSubjectId = sel ? Number(sel) : null;
                saveSettings();
                // Update timer if not running
                if (!isRunning)
                    resetTimer('work');
                if (modal)
                    modal.style.display = 'none';
                // Refresh display
                updateDisplay();
            });
        // Load subjects in background
        loadSubjectsToSelect();
    });
})();
