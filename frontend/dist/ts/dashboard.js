var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiGet, apiPost, apiDelete, apiPut } from "./api.js";
// Función para formatear fechas
function formatDate(dateString) {
    if (!dateString)
        return "No programado";
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
// Función para obtener el nombre de la prioridad
function getPriorityName(priority) {
    if (!priority)
        return "Sin prioridad";
    const priorities = {
        1: "Alta",
        2: "Media",
        3: "Baja"
    };
    return priorities[priority] || "Sin prioridad";
}
// Función para obtener el color de la prioridad
function getPriorityColor(priority) {
    if (!priority)
        return "#71717a";
    const colors = {
        1: "#ef4444", // Rojo para alta
        2: "#f59e0b", // Amarillo para media
        3: "#10b981" // Verde para baja
    };
    return colors[priority] || "#71717a";
}
// Cargar y mostrar estadísticas de hábitos
function loadHabitsStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const habits = yield apiGet("/habits/");
            const totalHabits = habits.length;
            const maxStreak = habits.length > 0
                ? Math.max(...habits.map(h => h.streak))
                : 0;
            const avgStreak = habits.length > 0
                ? Math.round(habits.reduce((sum, h) => sum + h.streak, 0) / habits.length)
                : 0;
            // Actualizar estadísticas
            const totalEl = document.getElementById("total-habits");
            const maxStreakEl = document.getElementById("max-streak");
            const avgStreakEl = document.getElementById("avg-streak");
            if (totalEl)
                totalEl.textContent = totalHabits.toString();
            if (maxStreakEl)
                maxStreakEl.textContent = maxStreak.toString();
            if (avgStreakEl)
                avgStreakEl.textContent = avgStreak.toString();
            // Mostrar hábitos recientes (top 5 por racha)
            const recentHabitsEl = document.getElementById("recent-habits");
            if (recentHabitsEl) {
                const sortedHabits = [...habits]
                    .sort((a, b) => b.streak - a.streak)
                    .slice(0, 5);
                if (sortedHabits.length === 0) {
                    recentHabitsEl.innerHTML = '<p class="empty-state">No tenés hábitos aún. <a href="habits.html">Creá tu primer hábito</a></p>';
                }
                else {
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
            const recentHabitsEl = document.getElementById("recent-habits");
            if (recentHabitsEl) {
                recentHabitsEl.innerHTML = '<p class="error-state">Error al cargar hábitos</p>';
            }
        }
    });
}
// Cargar y mostrar estadísticas de materias
function loadSubjectsStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const subjects = yield apiGet("/subjects/");
            const totalSubjects = subjects.length;
            const avgProgress = subjects.length > 0
                ? Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length)
                : 0;
            // Actualizar estadísticas
            const totalEl = document.getElementById("total-subjects");
            const avgProgressEl = document.getElementById("avg-progress");
            if (totalEl)
                totalEl.textContent = totalSubjects.toString();
            if (avgProgressEl) {
                avgProgressEl.textContent = `${avgProgress}%`;
                // Actualizar barra de progreso
                const progressBar = document.getElementById("avg-progress-bar");
                if (progressBar) {
                    progressBar.style.width = `${avgProgress}%`;
                }
            }
            // Mostrar materias con próximos exámenes
            const upcomingExamsEl = document.getElementById("upcoming-exams");
            if (upcomingExamsEl) {
                const subjectsWithExams = subjects
                    .filter(s => s.next_exam_date)
                    .sort((a, b) => {
                    if (!a.next_exam_date || !b.next_exam_date)
                        return 0;
                    return new Date(a.next_exam_date).getTime() - new Date(b.next_exam_date).getTime();
                })
                    .slice(0, 5);
                if (subjectsWithExams.length === 0) {
                    upcomingExamsEl.innerHTML = '<p class="empty-state">No tenés exámenes programados</p>';
                }
                else {
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
            // Mostrar todas las materias con progreso
            const allSubjectsEl = document.getElementById("all-subjects");
            if (allSubjectsEl) {
                if (subjects.length === 0) {
                    allSubjectsEl.innerHTML = '<p class="empty-state">No tenés materias aún. <a href="subjects.html">Agregá tu primera materia</a></p>';
                }
                else {
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
// Cargar y mostrar objetivos semanales
function loadWeeklyObjectives() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const objectives = yield apiGet("/weekly-objectives/");
            console.log("Objetivos cargados del backend:", objectives);
            const container = document.getElementById("weeklyObjectivesContainer");
            if (!container)
                return;
            // Guardar en localStorage también para referencia local
            localStorage.setItem('weeklyObjectives', JSON.stringify(objectives));
            // Cuando NO hay datos (Estado vacío)
            if (objectives.length === 0) {
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
                // Esto es para cuando SI hay datos
                container.innerHTML = objectives.map(obj => {
                    // Lógica de colores de prioridad 
                    const priorityMap = {
                        1: { name: 'MÁXIMA PRIORIDAD', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
                        2: { name: 'EXPLORACIÓN CLAVE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
                        3: { name: 'COMPLEMENTARIO', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
                    };
                    const priorityConfig = priorityMap[obj.priority || 2] || priorityMap[2];
                    // Usamos los datos guardados o fallbacks
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
                // Attach edit handlers
                container.querySelectorAll('.edit-objective').forEach(btn => {
                    btn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        e.stopPropagation();
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        if (id) {
                            const objId = Number(id);
                            const objective = objectives.find(o => o.id === objId);
                            if (objective) {
                                // Llenar modal con datos
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
                                // Cambiar botón a "Actualizar"
                                const submitBtn = document.getElementById('submitObjectiveBtn');
                                if (submitBtn)
                                    submitBtn.textContent = 'Actualizar Objetivo';
                                // Guardar id para saber que estamos editando
                                window.editingObjectiveId = objId;
                                const modal = document.getElementById('objectiveModal');
                                if (modal)
                                    modal.style.display = 'flex';
                            }
                        }
                    }));
                });
                // Attach delete handlers
                container.querySelectorAll('.delete-objective').forEach(btn => {
                    btn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        e.stopPropagation();
                        e.preventDefault();
                        const id = btn.getAttribute('data-id');
                        if (id)
                            yield deleteObjective(Number(id));
                    }));
                });
                // Attach inline edit handlers para icon y area - abre el modal
                container.querySelectorAll('.icon-display, .area-display').forEach(el => {
                    el.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        const id = el.getAttribute('data-id');
                        if (id) {
                            const objId = Number(id);
                            const objective = objectives.find(o => o.id === objId);
                            if (objective) {
                                // Llenar modal con datos
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
                                // Cambiar botón a "Actualizar"
                                const submitBtn = document.getElementById('submitObjectiveBtn');
                                if (submitBtn)
                                    submitBtn.textContent = 'Actualizar Objetivo';
                                // Guardar id para saber que estamos editando
                                window.editingObjectiveId = objId;
                                const modal = document.getElementById('objectiveModal');
                                if (modal)
                                    modal.style.display = 'flex';
                            }
                        }
                    }));
                });
            }
            // IMPORTANTE: Recargar iconos para el nuevo contenido inyectado
            lucide.createIcons();
        }
        catch (error) {
            console.error("Error loading weekly objectives:", error);
            // Opcional: Mostrar estado de error en el contenedor
        }
    });
}
function deleteObjective(id) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('¿Eliminar este objetivo?'))
            return;
        try {
            yield apiDelete(`/weekly-objectives/${id}/`);
            loadWeeklyObjectives();
        }
        catch (error) {
            console.error("Error deleting objective:", error);
            alert('Error al eliminar el objetivo');
        }
    });
}
function addObjective() {
    return __awaiter(this, void 0, void 0, function* () {
        const modal = document.getElementById('objectiveModal');
        if (!modal)
            return;
        // Cargar materias en el select
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
        // Mostrar modal
        modal.style.display = 'flex';
    });
}
function closeObjectiveModal() {
    const modal = document.getElementById('objectiveModal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Limpiar formulario
    const form = document.getElementById('objectiveForm');
    if (form) {
        form.reset();
    }
    // Resetear estado de edición
    window.editingObjectiveId = null;
    // Restaurar botón a "Guardar Objetivo"
    const submitBtn = document.getElementById('submitObjectiveBtn');
    if (submitBtn)
        submitBtn.textContent = 'Guardar Objetivo';
}
function submitObjectiveForm(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const titleEl = document.getElementById('objectiveTitle');
        const detailEl = document.getElementById('objectiveDetail');
        const areaEl = document.getElementById('objectiveArea');
        const iconEl = document.getElementById('objectiveIcon');
        const priorityEl = document.getElementById('objectivePriority');
        const notesEl = document.getElementById('objectiveNotes');
        if (!titleEl || !titleEl.value) {
            alert('Por favor ingresá un título');
            return;
        }
        try {
            const objectiveData = {
                title: titleEl.value,
                detail: (detailEl === null || detailEl === void 0 ? void 0 : detailEl.value) || '',
                notes: (notesEl === null || notesEl === void 0 ? void 0 : notesEl.value) || '',
                priority: (priorityEl === null || priorityEl === void 0 ? void 0 : priorityEl.value) ? Number(priorityEl.value) : 2,
                area: (areaEl === null || areaEl === void 0 ? void 0 : areaEl.value) || 'General',
                icon: (iconEl === null || iconEl === void 0 ? void 0 : iconEl.value) || '⚡',
                subject: null
            };
            console.log("Enviando datos del objetivo:", objectiveData);
            const editingId = window.editingObjectiveId;
            if (editingId) {
                // Estamos editando - usar PUT
                console.log(`Actualizando objetivo ${editingId}...`);
                yield apiPut(`/weekly-objectives/${editingId}/`, objectiveData);
                window.editingObjectiveId = null;
            }
            else {
                // Estamos creando nuevo - usar POST
                console.log("Creando nuevo objetivo...");
                yield apiPost('/weekly-objectives/', objectiveData, true);
            }
            closeObjectiveModal();
            loadWeeklyObjectives();
        }
        catch (error) {
            console.error("Error creating/updating objective:", error);
            alert('Error al guardar el objetivo');
        }
    });
}
// Cargar y mostrar estadísticas de Pomodoro
function loadPomodoroStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sessions = yield apiGet("/pomodoro/");
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todaySessions = sessions.filter(s => {
                const sessionDate = new Date(s.start_time);
                sessionDate.setHours(0, 0, 0, 0);
                return sessionDate.getTime() === today.getTime();
            });
            const totalMinutesToday = todaySessions.reduce((sum, s) => sum + s.duration, 0);
            const totalSessionsToday = todaySessions.length;
            // Actualizar estadísticas
            const sessionsTodayEl = document.getElementById("sessions-today");
            const minutesTodayEl = document.getElementById("minutes-today");
            if (sessionsTodayEl)
                sessionsTodayEl.textContent = totalSessionsToday.toString();
            if (minutesTodayEl)
                minutesTodayEl.textContent = totalMinutesToday.toString();
            // Mostrar sesiones recientes
            const recentSessionsEl = document.getElementById("recent-sessions");
            if (recentSessionsEl) {
                const recentSessions = sessions
                    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                    .slice(0, 5);
                if (recentSessions.length === 0) {
                    recentSessionsEl.innerHTML = '<p class="empty-state">No tenés sesiones de Pomodoro aún</p>';
                }
                else {
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
// Función principal para cargar todo el dashboard
function loadDashboard() {
    return __awaiter(this, void 0, void 0, function* () {
        const loadingEl = document.getElementById("dashboard-content");
        if (loadingEl) {
            loadingEl.innerHTML = '<p class="loading">Cargando datos del dashboard...</p>';
        }
        try {
            yield Promise.all([
                loadHabitsStats(),
                loadSubjectsStats(),
                loadPomodoroStats(),
                loadWeeklyObjectives()
            ]);
            if (loadingEl) {
                loadingEl.style.display = "none";
            }
        }
        catch (error) {
            console.error("Error loading dashboard:", error);
            if (loadingEl) {
                loadingEl.innerHTML = '<p class="error-state">Error al cargar el dashboard. Por favor, recargá la página.</p>';
            }
        }
    });
}
// Cargar el dashboard cuando se carga la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
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
// ---------------- Pomodoro functionality ----------------
(() => {
    const DEFAULTS = {
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLongBreak: 4,
    };
    let settings = Object.assign({}, DEFAULTS);
    let timerInterval = null;
    let remainingSeconds = settings.workMinutes * 60;
    let currentStage = 'work';
    let isRunning = false;
    let completedCycles = 0; // number of work sessions completed in current set
    let sessionStart = null; // when current work started
    let defaultSubjectId = null;
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
    const CIRCLE_LENGTH = 552; // matches SVG stroke-dasharray
    function loadSettings() {
        try {
            const raw = localStorage.getItem('pomodoroSettings');
            if (raw) {
                const parsed = JSON.parse(raw);
                settings = Object.assign(Object.assign({}, settings), parsed);
            }
        }
        catch (e) { /* ignore */ }
    }
    function saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    }
    function formatTime(seconds) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    function updateDisplay() {
        if (timerDisplay)
            timerDisplay.textContent = formatTime(remainingSeconds);
        if (stageLabel) {
            if (currentStage === 'work')
                stageLabel.textContent = 'Enfoque';
            else if (currentStage === 'short_break')
                stageLabel.textContent = 'Descanso corto';
            else
                stageLabel.textContent = 'Descanso largo';
        }
        if (circle) {
            const total = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
            const progress = Math.max(0, Math.min(1, 1 - remainingSeconds / total));
            const offset = Math.round(CIRCLE_LENGTH * (1 - progress));
            circle.style.strokeDashoffset = `${offset}`;
        }
        // Update pomodoro counters (pomodoros completed and set progress)
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
    function startTimer() {
        if (isRunning)
            return;
        isRunning = true;
        updatePlayButtonState();
        if (!sessionStart && currentStage === 'work')
            sessionStart = new Date();
        timerInterval = window.setInterval(() => {
            remainingSeconds -= 1;
            if (remainingSeconds <= 0) {
                // stage finished
                playBeep();
                clearInterval(timerInterval);
                timerInterval = null;
                isRunning = false;
                // If work finished, save session
                if (currentStage === 'work' && sessionStart) {
                    const end = new Date();
                    const durationMin = Math.round((end.getTime() - sessionStart.getTime()) / 60000);
                    saveWorkSession(sessionStart, end, durationMin, defaultSubjectId).catch(err => console.error('Error saving pomodoro session', err));
                    sessionStart = null;
                    completedCycles += 1;
                }
                // advance stage
                advanceStage();
            }
            updateDisplay();
        }, 1000);
    }
    function pauseTimer() {
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
        updatePlayButtonState();
    }
    function resetTimer(toStage = null) {
        pauseTimer();
        if (toStage)
            currentStage = toStage;
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        sessionStart = null;
        updateDisplay();
    }
    function skipStage() {
        // finish current stage immediately
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
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
    function advanceStage() {
        if (currentStage === 'work') {
            // decide break type
            if (completedCycles > 0 && completedCycles % settings.cyclesBeforeLongBreak === 0) {
                currentStage = 'long_break';
            }
            else {
                currentStage = 'short_break';
            }
        }
        else {
            // from break go to work
            currentStage = 'work';
        }
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        updateDisplay();
    }
    function saveWorkSession(start, end, durationMin, subjectId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const payload = {
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                    duration: durationMin,
                };
                if (subjectId)
                    payload.subject = subjectId;
                yield apiPost('/pomodoro/', payload, true);
                // refresh pomodoro stats
                loadPomodoroStats().catch(e => console.warn('refresh pomodoro stats failed', e));
            }
            catch (e) {
                console.error('Failed to save pomodoro session', e);
            }
        });
    }
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
    // Función auxiliar para cambiar el icono del botón
    function updatePlayButtonState() {
        if (!playBtn)
            return;
        if (isRunning) {
            // Si está corriendo -> Mostrar PAUSA
            // Quitamos ml-1 porque el icono de pausa ya se ve centrado
            playBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
        }
        else {
            // Si está detenido -> Mostrar PLAY
            // Agregamos ml-1 para compensación óptica visual
            playBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 ml-1"></i>';
        }
        // IMPORTANTE: Renderizar el nuevo icono
        lucide.createIcons();
    }
    // UI wiring
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        // apply settings initial
        remainingSeconds = settings.workMinutes * 60;
        updateDisplay();
        // bind buttons
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
        // settings modal
        if (settingsBtn && modal) {
            settingsBtn.addEventListener('click', () => __awaiter(void 0, void 0, void 0, function* () {
                // populate fields
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
        if (modalCancel && modal)
            modalCancel.addEventListener('click', () => { if (modal)
                modal.style.display = 'none'; });
        if (settingsForm && modal)
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // read values
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
                // update timer if stopped
                if (!isRunning)
                    resetTimer('work');
                if (modal)
                    modal.style.display = 'none';
                // Refresh counters/UI to reflect new settings
                updateDisplay();
            });
        // initialize subject select load in background
        loadSubjectsToSelect();
    });
})();
