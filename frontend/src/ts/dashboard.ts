import { apiGet, apiPost, apiDelete, apiPut, getToken } from "./api.js";

declare const lucide: any;

// Interfaces del dashboard  

interface Habit {
    id: number;
    name: string;
    frequency: number;
    streak: number;
    subject: number | null;
    created_at: string;
    is_key: boolean;
    completed_today: boolean;
}

interface Subject {
    id: number;
    name: string;
    priority: number | null;
    color: string | null;
    progress: number;
    next_exam_date: string | null;
    professor_name: string | null;
}

interface PomodoroSession {
    id: number;
    subject: number | null;
    start_time: string;
    end_time: string;
    duration: number;
    notes: string;
}

interface WeeklyObjective {
    id: number;
    title: string;
    detail: string;
    priority: number | null;
    notes: string;    
    area?: string; 
    icon?: string; 
    subject: number | null;
    created_at: string;
}

// Función para formatear fechas
function formatDate(dateString: string | null): string {
    if (!dateString) return "No programado"; // Caso de error: no se ha programado una fecha.
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Pasado";
    if (diffDays === 0) return "Hoy";
    if (diffDays === 1) return "Mañana";
    if (diffDays <= 7) return `En ${diffDays} días`;
    
    return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
}

// Función para obtener el nombre de la prioridad
function getPriorityName(priority: number | null): string {
    if (!priority) return "Sin prioridad"; // Caso de error: no hay prioridad asignada.
    const priorities: { [key: number]: string } = {
        1: "Alta",
        2: "Media",
        3: "Baja"
    };
    return priorities[priority] || "Sin prioridad";
}

// Función para obtener el color de la prioridad
function getPriorityColor(priority: number | null): string {
    if (!priority) return "#71717a";    // Si no hay prioridad, se asigna un color por defecto.
    const colors: { [key: number]: string } = {
        1: "#ef4444", // Rojo para alta
        2: "#f59e0b", // Amarillo para media
        3: "#10b981"  // Verde para baja
    };
    return colors[priority] || "#71717a";
}

// Cargar y mostrar estadísticas de hábitos
async function loadHabitsStats() {
    try {
        const habits: Habit[] = await apiGet("/habits/");
        
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
        
        if (totalEl) totalEl.textContent = totalHabits.toString();
        if (maxStreakEl) maxStreakEl.textContent = maxStreak.toString();
        if (avgStreakEl) avgStreakEl.textContent = avgStreak.toString();
        
        // Mostrar hábitos recientes (top 5 por racha)
        const recentHabitsEl = document.getElementById("recent-habits");
        if (recentHabitsEl) {
            const sortedHabits = [...habits]
                .sort((a, b) => b.streak - a.streak)
                .slice(0, 5);
            
            if (sortedHabits.length === 0) {
                recentHabitsEl.innerHTML = '<p class="empty-state">No tenés hábitos aún. <a href="habits.html">Creá tu primer hábito</a></p>';
            } else {
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
    } catch (error) {
        console.error("Error loading habits:", error);
        const recentHabitsEl = document.getElementById("recent-habits");
        if (recentHabitsEl) {
            recentHabitsEl.innerHTML = '<p class="error-state">Error al cargar hábitos</p>';
        }
    }
}

// Cargar y mostrar estadísticas de materias
async function loadSubjectsStats() {
    try {
        const subjects: Subject[] = await apiGet("/subjects/");
        
        const totalSubjects = subjects.length;
        const avgProgress = subjects.length > 0
            ? Math.round(subjects.reduce((sum, s) => sum + s.progress, 0) / subjects.length)
            : 0;
        
        // Actualizar estadísticas
        const totalEl = document.getElementById("total-subjects");
        const avgProgressEl = document.getElementById("avg-progress");
        
        if (totalEl) totalEl.textContent = totalSubjects.toString();
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
                    if (!a.next_exam_date || !b.next_exam_date) return 0;
                    return new Date(a.next_exam_date).getTime() - new Date(b.next_exam_date).getTime();
                })
                .slice(0, 5);
            
            if (subjectsWithExams.length === 0) {
                upcomingExamsEl.innerHTML = '<p class="empty-state">No tenés exámenes programados</p>';
            } else {
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
            } else {
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
    } catch (error) {
        console.error("Error loading subjects:", error);
    }
}

// Cargar y mostrar objetivos semanales
async function loadWeeklyObjectives() {
    try {
        const objectives: WeeklyObjective[] = await apiGet("/weekly-objectives/");  // Espera a la respuesta de la API 
        
        const container = document.getElementById("weeklyObjectivesContainer");
        
        if (!container) return; 
        
        // Guardar en localStorage también para referencia local
        localStorage.setItem('weeklyObjectives', JSON.stringify(objectives));
        
        // Cuando NO hay datos (Estado vacío)
        if (objectives.length === 0) {  // Si el array de objetives tiene longitud vacía, entonces quiere decir que el usuario no tiene objetivos semanales definidos.
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
        } else {
            // Esto es para cuando SI hay datos
            container.innerHTML = objectives.map(obj => {
                // Lógica de colores de prioridad 
                const priorityMap: Record<number, { name: string; color: string; bg: string; border: string }> = {
                    1: { name: 'MÁXIMA PRIORIDAD', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.2)' },
                    2: { name: 'EXPLORACIÓN CLAVE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.2)' },
                    3: { name: 'COMPLEMENTARIO', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.2)' }
                };

                const priorityConfig = priorityMap[obj.priority || 2] || priorityMap[2];

                // Usamos los datos guardados o fallbacks
                const displayIcon = obj.icon || '⚡'; // Ícono por defecto
                const displayArea = obj.area || 'General';  // Label por defecto.

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
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const id = (btn as HTMLElement).getAttribute('data-id');
                    if (id) {
                        const objId = Number(id);
                        const objective = objectives.find(o => o.id === objId);
                        if (objective) {
                            // Llenar modal con datos
                            const titleEl = document.getElementById('objectiveTitle') as HTMLInputElement;
                            const detailEl = document.getElementById('objectiveDetail') as HTMLTextAreaElement;
                            const areaEl = document.getElementById('objectiveArea') as HTMLInputElement;
                            const iconEl = document.getElementById('objectiveIcon') as HTMLSelectElement;
                            const priorityEl = document.getElementById('objectivePriority') as HTMLSelectElement;
                            const notesEl = document.getElementById('objectiveNotes') as HTMLInputElement;
                            
                            if (titleEl) titleEl.value = objective.title;
                            if (detailEl) detailEl.value = objective.detail || '';
                            if (areaEl) areaEl.value = objective.area || 'General';
                            if (priorityEl) priorityEl.value = (objective.priority || 2).toString();
                            if (notesEl) notesEl.value = objective.notes || '';
                            
                            // Cambiar botón a "Actualizar"
                            const submitBtn = document.getElementById('submitObjectiveBtn') as HTMLButtonElement;
                            if (submitBtn) submitBtn.textContent = 'Actualizar Objetivo';
                            
                            // Guardar id para saber que estamos editando
                            (window as any).editingObjectiveId = objId;
                            
                            const modal = document.getElementById('objectiveModal');
                            if (modal) modal.style.display = 'flex';
                        }
                    }
                });
            });
            
            // Attach delete handlers
            container.querySelectorAll('.delete-objective').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const id = (btn as HTMLElement).getAttribute('data-id');
                    if (id) await deleteObjective(Number(id));
                });
            });
            
            // Attach inline edit handlers para icon y area - abre el modal
            container.querySelectorAll('.icon-display, .area-display').forEach(el => {
                el.addEventListener('click', async (e) => {
                    const id = (el as HTMLElement).getAttribute('data-id');
                    if (id) {
                        const objId = Number(id);
                        const objective = objectives.find(o => o.id === objId);
                        if (objective) {
                            // Llenar modal con datos
                            const titleEl = document.getElementById('objectiveTitle') as HTMLInputElement;
                            const detailEl = document.getElementById('objectiveDetail') as HTMLTextAreaElement;
                            const areaEl = document.getElementById('objectiveArea') as HTMLInputElement;
                            const iconEl = document.getElementById('objectiveIcon') as HTMLSelectElement;
                            const priorityEl = document.getElementById('objectivePriority') as HTMLSelectElement;
                            const notesEl = document.getElementById('objectiveNotes') as HTMLInputElement;
                            
                            if (titleEl) titleEl.value = objective.title;
                            if (detailEl) detailEl.value = objective.detail || '';
                            if (areaEl) areaEl.value = objective.area || 'General';
                            if (iconEl) iconEl.value = objective.icon || '⚡';
                            if (priorityEl) priorityEl.value = (objective.priority || 2).toString();
                            if (notesEl) notesEl.value = objective.notes || '';
                            
                            // Cambiar botón a "Actualizar"
                            const submitBtn = document.getElementById('submitObjectiveBtn') as HTMLButtonElement;
                            if (submitBtn) submitBtn.textContent = 'Actualizar Objetivo';
                            
                            // Guardar id para saber que estamos editando
                            (window as any).editingObjectiveId = objId;
                            
                            const modal = document.getElementById('objectiveModal');
                            if (modal) modal.style.display = 'flex';
                        }
                    }
                });
            });
        }
        
        // IMPORTANTE: Recargar iconos para el nuevo contenido inyectado (si el lib está disponible)
        if (typeof lucide !== 'undefined') lucide.createIcons();
        
    } catch (error) {
        console.error("Error loading weekly objectives:", error);   // Manejo de errores: muestra el error al cargar los objetivos semanales.
    }
}

async function deleteObjective(id: number) {
    if (!confirm('¿Eliminar este objetivo?')) return;
    try {
        await apiDelete(`/weekly-objectives/${id}/`);
        loadWeeklyObjectives();
    } catch (error) {
        console.error("Error deleting objective:", error);
        alert('Error al eliminar el objetivo');
    }
}

async function addObjective() {
    const modal = document.getElementById('objectiveModal') as HTMLDivElement | null;
    if (!modal) return;
    
    // Cargar materias en el select
    try {
        const subjects: Subject[] = await apiGet('/subjects/');
        const subjectSelect = document.getElementById('objectiveSubject') as HTMLSelectElement | null;
        if (subjectSelect) {
            subjectSelect.innerHTML = '<option value="">-- Ninguna materia --</option>' + 
                subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    } catch (e) {
        console.warn('Could not load subjects for objective modal', e);
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
}

function closeObjectiveModal() {
    const modal = document.getElementById('objectiveModal') as HTMLDivElement | null;
    if (modal) {
        modal.style.display = 'none';
    }
    // Limpiar formulario
    const form = document.getElementById('objectiveForm') as HTMLFormElement | null;
    if (form) {
        form.reset();
    }
    // Resetear estado de edición
    (window as any).editingObjectiveId = null;
    // Restaurar botón a "Guardar Objetivo"
    const submitBtn = document.getElementById('submitObjectiveBtn') as HTMLButtonElement;
    if (submitBtn) submitBtn.textContent = 'Guardar Objetivo';
}

async function submitObjectiveForm(e: Event) {
    e.preventDefault();
    
    const titleEl = document.getElementById('objectiveTitle') as HTMLInputElement;
    const detailEl = document.getElementById('objectiveDetail') as HTMLTextAreaElement;
    const areaEl = document.getElementById('objectiveArea') as HTMLInputElement;
    const iconEl = document.getElementById('objectiveIcon') as HTMLSelectElement;
    const priorityEl = document.getElementById('objectivePriority') as HTMLSelectElement;
    const notesEl = document.getElementById('objectiveNotes') as HTMLInputElement;
    
    if (!titleEl || !titleEl.value) {
        alert('Por favor ingresá un título');
        return;
    }
    
    try {
        const objectiveData = {
            title: titleEl.value,
            detail: detailEl?.value || '',
            notes: notesEl?.value || '',
            priority: priorityEl?.value ? Number(priorityEl.value) : 2,
            area: areaEl?.value || 'General', 
            icon: iconEl?.value || '⚡',
            subject: null 
        };
        
        console.log("Enviando datos del objetivo:", objectiveData);
        
        const editingId = (window as any).editingObjectiveId;
        
        if (editingId) {
            // Estamos editando - usar PUT
            console.log(`Actualizando objetivo ${editingId}...`);
            await apiPut(`/weekly-objectives/${editingId}/`, objectiveData);
            (window as any).editingObjectiveId = null;
        } else {
            // Estamos creando nuevo - usar POST
            console.log("Creando nuevo objetivo...");
            await apiPost('/weekly-objectives/', objectiveData, true);
        }
        
        closeObjectiveModal();
        loadWeeklyObjectives();
    } catch (error) {
        console.error("Error creating/updating objective:", error);
        alert('Error al guardar el objetivo');
    }
}

// Cargar y mostrar estadísticas de Pomodoro
async function loadPomodoroStats() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        
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
        
        if (sessionsTodayEl) sessionsTodayEl.textContent = totalSessionsToday.toString();
        if (minutesTodayEl) minutesTodayEl.textContent = totalMinutesToday.toString();
        
        // Mostrar sesiones recientes
        const recentSessionsEl = document.getElementById("recent-sessions");
        if (recentSessionsEl) {
            const recentSessions = sessions
                .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
                .slice(0, 5);
            
            if (recentSessions.length === 0) {
                recentSessionsEl.innerHTML = '<p class="empty-state">No tenés sesiones de Pomodoro aún</p>';
            } else {
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
    } catch (error) {
        console.error("Error loading pomodoro sessions:", error);
    }
}

// Cargar ritmo de estudio semanal basado en Pomodoro
async function loadWeeklyStudyRhythm() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        
        // Obtener sesiones de la última semana
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklySessions = sessions.filter(s => {
            const sessionDate = new Date(s.start_time);
            return sessionDate >= weekAgo;
        });
        
        // Agrupar por día de la semana (0 = Domingo, 1 = Lunes, etc.)
        const dayMinutes: { [key: number]: number } = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
        
        weeklySessions.forEach(session => {
            const sessionDate = new Date(session.start_time);
            const dayOfWeek = sessionDate.getDay();
            dayMinutes[dayOfWeek] += session.duration;
        });
        
        // Convertir a array para el gráfico (Lunes a Domingo)
        const weekDays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
        const dataPoints = [
            dayMinutes[1], // Lunes
            dayMinutes[2], // Martes
            dayMinutes[3], // Miércoles
            dayMinutes[4], // Jueves
            dayMinutes[5], // Viernes
            dayMinutes[6], // Sábado
            dayMinutes[0]  // Domingo
        ];
        
        // Encontrar máximo para escalar el gráfico
        const maxMinutes = Math.max(...dataPoints, 1);
        const maxHeight = 120; // Altura máxima del gráfico en píxeles
        
        // Actualizar SVG del gráfico
        const chartContainer = document.getElementById('weekly-rhythm-chart');
        const chartParent = chartContainer?.parentElement;
        
        if (chartContainer && chartParent) {
            // Si no hay datos, mostrar empty state
            if (weeklySessions.length === 0) {
                chartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="bar-chart-2" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">Aún no hay sesiones de Pomodoro esta semana</p>
                        <p class="text-gray-600 text-xs text-center mt-1">Completá algunas sesiones para ver tu ritmo de estudio</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            const svg = chartContainer as unknown as SVGElement;
            const width = 450;
            const step = width / 6;
            
            // Generar path para el gráfico de línea
            let pathD = '';
            const points: { x: number; y: number }[] = [];
            
            dataPoints.forEach((minutes, index) => {
                const x = index * step;
                const y = maxHeight - (minutes / maxMinutes) * maxHeight;
                points.push({ x, y });
            });
            
            // Crear path suave con curvas
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
            } else if (points.length === 1) {
                pathD = `M ${points[0].x} ${points[0].y}`;
            }
            
            const weekDays = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            
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
            
            // Agregar tooltips interactivos
            const circles = svg.querySelectorAll('circle');
            circles.forEach((circle, index) => {
                const minutes = dataPoints[index];
                const hours = (minutes / 60).toFixed(1);
                const day = weekDays[index];
                
                circle.addEventListener('mouseenter', (e: MouseEvent) => {
                    const tooltip = document.createElement('div');
                    tooltip.id = 'rhythm-tooltip';
                    tooltip.className = 'fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none';
                    tooltip.innerHTML = `
                        <div class="font-bold text-purple-400">${day}</div>
                        <div class="text-gray-300">${hours}h (${minutes} min)</div>
                    `;
                    document.body.appendChild(tooltip);
                    
                    // Posicionar cerca del cursor
                    updateTooltipPosition(tooltip, e.clientX, e.clientY);
                });
                
                circle.addEventListener('mouseleave', () => {
                    const tooltip = document.getElementById('rhythm-tooltip');
                    if (tooltip) tooltip.remove();
                });
                
                circle.addEventListener('mousemove', (e: MouseEvent) => {
                    const tooltip = document.getElementById('rhythm-tooltip');
                    if (tooltip) {
                        updateTooltipPosition(tooltip, e.clientX, e.clientY);
                    }
                });
            });
        }
    } catch (error) {
        console.error("Error loading weekly study rhythm:", error);
    }
}

// Cargar distribución de enfoque por materia basado en Pomodoro
async function loadFocusDistribution() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        const subjects: Subject[] = await apiGet("/subjects/");
        
        console.log('All sessions:', sessions);
        console.log('All subjects:', subjects);
        
        // Obtener sesiones de la última semana
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklySessions = sessions.filter(s => {
            const sessionDate = new Date(s.start_time);
            return sessionDate >= weekAgo;
        });
        
        // Agrupar minutos por materia
        const subjectMinutes: { [key: number]: number } = {};
        let totalMinutes = 0;
        
        weeklySessions.forEach(session => {
            // Debug: ver qué está llegando
            console.log('Session:', session, 'Subject ID:', session.subject, 'Type:', typeof session.subject);
            
            // El subject puede venir como número o null/undefined
            let subjectId: number | null = null;
            if (session.subject !== null && session.subject !== undefined) {
                // Convertir a número si es string
                subjectId = typeof session.subject === 'string' ? parseInt(session.subject) : session.subject;
            }
            
            // Usar una clave especial para "sin materia" que no colisione con IDs reales
            const key = subjectId !== null && !isNaN(subjectId) ? subjectId : -1;
            
            if (!subjectMinutes[key]) {
                subjectMinutes[key] = 0;
            }
            subjectMinutes[key] += session.duration;
            totalMinutes += session.duration;
        });
        
        console.log('Subject minutes:', subjectMinutes);
        console.log('Total minutes:', totalMinutes);
        
        // Crear array de materias con minutos (solo las que tienen ID real)
        const subjectData = subjects
            .filter(s => subjectMinutes[s.id] && subjectMinutes[s.id] > 0)
            .map(s => ({
                id: s.id,
                name: s.name,
                minutes: subjectMinutes[s.id],
                percentage: totalMinutes > 0 ? (subjectMinutes[s.id] / totalMinutes) * 100 : 0
            }))
            .sort((a, b) => b.minutes - a.minutes);
        
        // Si hay sesiones sin materia (key = -1), agregarlas al final
        if (subjectMinutes[-1] && subjectMinutes[-1] > 0) {
            subjectData.push({
                id: -1,
                name: 'Sin materia',
                minutes: subjectMinutes[-1],
                percentage: totalMinutes > 0 ? (subjectMinutes[-1] / totalMinutes) * 100 : 0
            });
        }
        
        // Colores para el gráfico
        const colors = ['#a855f7', '#60a5fa', '#34d399', '#fbbf24', '#ec4899', '#8b5cf6'];
        
        // Generar gradiente cónico
        let conicGradient = '';
        let currentPercent = 0;
        
        subjectData.forEach((subject, index) => {
            const color = colors[index % colors.length];
            const startPercent = currentPercent;
            const endPercent = currentPercent + subject.percentage;
            conicGradient += `${color} ${startPercent}% ${endPercent}%, `;
            currentPercent = endPercent;
        });
        
        // Actualizar gráfico de distribución
        const pieChart = document.getElementById('focus-distribution-chart');
        const pieChartParent = pieChart?.parentElement;
        
        if (pieChart && pieChartParent) {
            if (weeklySessions.length === 0 || subjectData.length === 0) {
                // Mostrar empty state
                pieChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-12 h-12 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-sm text-center">Aún no hay sesiones de Pomodoro</p>
                        <p class="text-gray-600 text-xs text-center mt-1">Completá sesiones para ver la distribución</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            (pieChart as HTMLElement).style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
            
            // Actualizar total de horas (mostrar con decimales si es menos de 1 hora)
            const totalHoursEl = document.getElementById('focus-total-hours');
            if (totalHoursEl) {
                if (totalMinutes < 60) {
                    totalHoursEl.textContent = `${totalMinutes}m`;
                } else {
                    const hours = Math.floor(totalMinutes / 60);
                    const mins = totalMinutes % 60;
                    if (mins === 0) {
                        totalHoursEl.textContent = `${hours}h`;
                    } else {
                        totalHoursEl.textContent = `${hours}h ${mins}m`;
                    }
                }
            }
            
            // Actualizar leyenda
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
    } catch (error) {
        console.error("Error loading focus distribution:", error);
    }
}

// Cargar momento peak de productividad basado en Pomodoro
async function loadPeakProductivity() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        
        // Obtener sesiones de las últimas 4 semanas
        const today = new Date();
        const fourWeeksAgo = new Date(today);
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
        
        const recentSessions = sessions.filter(s => {
            const sessionDate = new Date(s.start_time);
            return sessionDate >= fourWeeksAgo;
        });
        
        // Si no hay suficientes sesiones, mostrar mensaje
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
        
        // Agrupar por hora del día (0-23) y contar minutos totales por hora
        const hourMinutes: { [key: number]: number } = {};
        
        recentSessions.forEach(session => {
            const sessionDate = new Date(session.start_time);
            const hour = sessionDate.getHours();
            if (!hourMinutes[hour]) {
                hourMinutes[hour] = 0;
            }
            hourMinutes[hour] += session.duration;
        });
        
        // Encontrar la hora con más minutos
        let peakHour = 14; // Default si no hay datos
        let maxMinutes = 0;
        
        Object.keys(hourMinutes).forEach(hourStr => {
            const hour = parseInt(hourStr);
            const minutes = hourMinutes[hour];
            if (minutes > maxMinutes) {
                maxMinutes = minutes;
                peakHour = hour;
            }
        });
        
        // Si no hay datos suficientes, usar default
        if (maxMinutes === 0) {
            peakHour = 14;
        }
        
        // Calcular rango de 3 horas alrededor del peak (1 hora antes, peak, 1 hora después)
        const startHour = Math.max(0, peakHour - 1);
        const endHour = Math.min(23, peakHour + 1);
        
        // Formatear hora
        const formatHour = (h: number) => {
            return `${h.toString().padStart(2, '0')}:00`;
        };
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const todayName = dayNames[today.getDay()];
        
        // Actualizar UI
        const peakEl = document.getElementById('peak-productivity-time');
        if (peakEl) {
            peakEl.textContent = `${todayName}, ${formatHour(startHour)} - ${formatHour(endHour)}`;
        }
        
        const descriptionEl = document.getElementById('peak-productivity-desc');
        if (descriptionEl) {
            descriptionEl.innerHTML = `
                Datos de las últimas 4 semanas indican que esta es tu franja de máxima concentración. 
                <span class="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent font-medium">¡Aprovechala al máximo para tareas complejas!</span>
            `;
        }
    } catch (error) {
        console.error("Error loading peak productivity:", error);
    }
}

// Cargar revisión de balance semanal basado en Pomodoro
async function loadWeeklyBalance() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        const subjects: Subject[] = await apiGet("/subjects/");
        
        // Obtener sesiones de la última semana
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const weeklySessions = sessions.filter(s => {
            const sessionDate = new Date(s.start_time);
            return sessionDate >= weekAgo;
        });
        
        // Agrupar minutos por materia
        const subjectMinutes: { [key: number]: number } = {};
        let totalMinutes = 0;
        
        weeklySessions.forEach(session => {
            const subjectId = session.subject || 0;
            if (!subjectMinutes[subjectId]) {
                subjectMinutes[subjectId] = 0;
            }
            subjectMinutes[subjectId] += session.duration;
            totalMinutes += session.duration;
        });
        
        // Obtener top 3 materias
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
        
        // Colores para el gráfico
        const colors = ['#c084fc', '#fbbf24', '#34d399'];
        
        // Generar gradiente cónico
        let conicGradient = '';
        let currentPercent = 0;
        
        topSubjects.forEach((subject, index) => {
            const color = colors[index % colors.length];
            const startPercent = currentPercent;
            const endPercent = currentPercent + subject.percentage;
            conicGradient += `${color} ${startPercent}% ${endPercent}%, `;
            currentPercent = endPercent;
        });
        
        // Actualizar gráfico de balance
        const balanceChart = document.getElementById('weekly-balance-chart');
        const balanceChartParent = balanceChart?.parentElement;
        
        if (balanceChart && balanceChartParent) {
            if (weeklySessions.length === 0 || topSubjects.length === 0) {
                // Mostrar empty state
                balanceChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-8">
                        <i data-lucide="pie-chart" class="w-10 h-10 text-gray-600 mb-3"></i>
                        <p class="text-gray-500 text-xs text-center">Aún no hay sesiones esta semana</p>
                        <p class="text-gray-600 text-[10px] text-center mt-1">Completá sesiones para ver el balance</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            (balanceChart as HTMLElement).style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
            
            // Actualizar total de horas
            const totalHoursEl = document.getElementById('weekly-balance-hours');
            if (totalHoursEl) {
                const totalHours = Math.round(totalMinutes / 60);
                totalHoursEl.textContent = `${totalHours}h`;
            }
        }
    } catch (error) {
        console.error("Error loading weekly balance:", error);
    }
}

// Función auxiliar para posicionar tooltip cerca del cursor
function updateTooltipPosition(tooltip: HTMLElement, mouseX: number, mouseY: number) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = 15; // Distancia del cursor al tooltip
    
    // Posicionar a la derecha y arriba del cursor por defecto
    let left = mouseX + offset;
    let top = mouseY - tooltipRect.height - offset;
    
    // Ajustar si se sale de la pantalla horizontalmente
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = mouseX - tooltipRect.width - offset; // A la izquierda del cursor
    }
    if (left < 10) {
        left = 10;
    }
    
    // Ajustar si se sale de la pantalla verticalmente
    if (top < 10) {
        top = mouseY + offset; // Abajo del cursor
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - tooltipRect.height - 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

// Función para toggle de hábito (similar a habits.ts)
async function toggleHabitCompletion(habitId: number, complete: boolean) {
    const token = getToken();
    if (!token) return;

    try {
        // Actualizar UI inmediatamente (optimistic update)
        const habitElement = document.querySelector(`[data-habit-id="${habitId}"]`)?.closest('.flex.items-center.justify-between');
        if (habitElement) {
            const checkbox = habitElement.querySelector('.w-6.h-6.rounded') as HTMLElement;
            const textElement = habitElement.querySelector('.flex.items-center.gap-2') as HTMLElement;
            const streakElement = habitElement.querySelector('.text-xs')?.parentElement;
            
            if (checkbox && textElement) {
                if (complete) {
                    checkbox.className = 'w-6 h-6 rounded bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-purple-500/20 flex items-center justify-center';
                    checkbox.style.boxShadow = '0 0 0 1px rgba(168,85,247,0.3)';
                    checkbox.innerHTML = '<i data-lucide="check" class="w-4 h-4 text-purple-400"></i>';
                    textElement.className = 'flex items-center gap-2 text-gray-400 line-through';
                } else {
                    checkbox.className = 'w-6 h-6 rounded border border-gray-600 flex items-center justify-center group-hover:border-purple-500';
                    checkbox.style.boxShadow = '';
                    checkbox.innerHTML = '';
                    textElement.className = 'flex items-center gap-2 text-gray-300 font-medium';
                }
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        }

        // Llamar a la API
        const response = await fetch(
            `http://127.0.0.1:8000/api/habits/${habitId}/complete/`,
            {
                method: complete ? "POST" : "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                }
            }
        );

        if (!response.ok) throw new Error("Error API");

        // Actualizar racha desde la respuesta
        const data = await response.json();
        if (data.streak !== undefined && habitElement) {
            const streakText = habitElement.querySelector('.text-xs')?.textContent;
            if (streakText) {
                const streakMatch = streakText.match(/\d+/);
                if (streakMatch) {
                    const streakEl = habitElement.querySelector('.text-xs');
                    if (streakEl) {
                        streakEl.innerHTML = `<i data-lucide="trending-up" class="w-3 h-3"></i> ${data.streak}`;
                        if (typeof lucide !== 'undefined') lucide.createIcons();
                    }
                }
            }
        }

        // Recargar hábitos para actualizar el estado completo
        loadKeyHabits();

    } catch (err) {
        console.error("Error toggling habit:", err);
        alert("Error de conexión. No se guardó.");
        // Recargar para revertir cambios
        loadKeyHabits();
    }
}

// Cargar hábitos clave
async function loadKeyHabits() {
    try {
        const habits: Habit[] = await apiGet("/habits/");
        
        // Filtrar solo hábitos clave
        const keyHabits = habits.filter(h => h.is_key);
        
        const keyHabitsContainer = document.getElementById('key-habits-container');
        if (!keyHabitsContainer) return;
        
        if (keyHabits.length === 0) {
            keyHabitsContainer.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i data-lucide="target" class="w-8 h-8 mx-auto mb-2 text-gray-600"></i>
                    <p class="text-sm">No tenés hábitos clave configurados aún.</p>
                    <p class="text-xs mt-1">Marcá algunos hábitos como clave en la página de hábitos.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        // Ordenar por racha descendente
        const sortedHabits = [...keyHabits].sort((a, b) => b.streak - a.streak);
        
        // Calcular progreso diario general (hábitos completados hoy)
        const completedToday = sortedHabits.filter(h => h.completed_today).length;
        
        const dailyProgress = sortedHabits.length > 0 
            ? Math.round((completedToday / sortedHabits.length) * 100) 
            : 0;
        
        // Renderizar hábitos
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
        
        // Agregar event listeners para los botones de completar
        keyHabitsContainer.querySelectorAll('.habit-complete-btn').forEach(button => {
            button.addEventListener('click', async (e) => {
                e.stopPropagation();
                const btn = e.currentTarget as HTMLElement;
                const id = Number(btn.getAttribute('data-habit-id'));
                const completed = btn.getAttribute('data-completed') === 'true';
                await toggleHabitCompletion(id, !completed);
            });
        });
        
        // Actualizar barra de progreso diario
        const progressBar = document.getElementById('daily-progress-bar');
        const progressText = document.getElementById('daily-progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${dailyProgress}%`;
        }
        if (progressText) {
            progressText.textContent = `${dailyProgress}%`;
        }
        
        if (typeof lucide !== 'undefined') lucide.createIcons();
    } catch (error) {
        console.error("Error loading key habits:", error);
    }
}

// Función principal para cargar todo el dashboard
async function loadDashboard() {
    const loadingEl = document.getElementById("dashboard-content");
    if (loadingEl) {
        loadingEl.innerHTML = '<p class="loading">Cargando datos del dashboard...</p>';
    }
    
    try {
        await Promise.all([
            loadHabitsStats(),
            loadSubjectsStats(),
            loadPomodoroStats(),
            loadWeeklyObjectives(),
            loadWeeklyStudyRhythm(),
            loadFocusDistribution(),
            loadPeakProductivity(),
            loadWeeklyBalance(),
            loadKeyHabits()
        ]);
        
        if (loadingEl) {
            loadingEl.style.display = "none";
        }
    } catch (error) {
        console.error("Error loading dashboard:", error);
        if (loadingEl) {
            loadingEl.innerHTML = '<p class="error-state">Error al cargar el dashboard. Por favor, recargá la página.</p>';
        }
    }
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
        const objectiveForm = document.getElementById('objectiveForm') as HTMLFormElement | null;
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
} else {
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
    
    const objectiveForm = document.getElementById('objectiveForm') as HTMLFormElement | null;
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
    type Stage = 'work' | 'short_break' | 'long_break';

    const DEFAULTS = {
        workMinutes: 25,
        shortBreakMinutes: 5,
        longBreakMinutes: 15,
        cyclesBeforeLongBreak: 4,
    };

    let settings = {
        ...DEFAULTS
    };

    let timerInterval: number | null = null;
    let remainingSeconds = settings.workMinutes * 60;
    let currentStage: Stage = 'work';
    let isRunning = false;
    let completedCycles = 0; // number of work sessions completed in current set
    let sessionStart: Date | null = null; // when current work started
    let defaultSubjectId: number | null = null;
    let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null;
    
    // Variables para manejar el timer cuando la pestaña está en segundo plano
    let timerStartTime: number | null = null; // Timestamp cuando se inició el timer
    let timerStartRemaining: number = 0; // Segundos restantes cuando se inició el timer
    let visibilityHandler: (() => void) | null = null; // Handler para visibilitychange

    const circle = document.getElementById('pomodoroProgressCircle') as SVGCircleElement | null;
    const timerDisplay = document.getElementById('pomodoroTimerDisplay');
    const stageLabel = document.getElementById('pomodoroStageLabel');
    const pomodorosCountEl = document.getElementById('pomodorosCount');
    const pomodoroSetLabelEl = document.getElementById('pomodoroSetLabel');
    const playBtn = document.getElementById('pomodoroPlayBtn');
    const skipBtn = document.getElementById('pomodoroSkipBtn');
    const resetBtn = document.getElementById('pomodoroResetBtn');
    const settingsBtn = document.getElementById('pomodoroSettingsBtn');

    const modal = document.getElementById('pomodoroSettingsModal') as HTMLDivElement | null;
    const settingsForm = document.getElementById('pomodoroSettingsForm') as HTMLFormElement | null;
    const workInput = document.getElementById('workMinutes') as HTMLInputElement | null;
    const shortInput = document.getElementById('shortBreakMinutes') as HTMLInputElement | null;
    const longInput = document.getElementById('longBreakMinutes') as HTMLInputElement | null;
    const cyclesInput = document.getElementById('cyclesBeforeLongBreak') as HTMLInputElement | null;
    const subjectSelect = document.getElementById('pomodoroDefaultSubjectSelect') as HTMLSelectElement | null;
    const modalCancel = document.getElementById('pomodoroSettingsCancel');

    const CIRCLE_LENGTH = 552; // matches SVG stroke-dasharray

    function loadSettings() {
        try {
            const raw = localStorage.getItem('pomodoroSettings');
            if (raw) {
                const parsed = JSON.parse(raw);
                settings = { ...settings, ...parsed };
            }
        } catch (e) { /* ignore */ }
    }

    function saveSettings() {
        localStorage.setItem('pomodoroSettings', JSON.stringify(settings));
    }

    function formatTime(seconds: number) {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateDisplay() {
        if (timerDisplay) timerDisplay.textContent = formatTime(remainingSeconds);
        if (stageLabel) {
            if (currentStage === 'work') stageLabel.textContent = 'Enfoque';
            else if (currentStage === 'short_break') stageLabel.textContent = 'Descanso corto';
            else stageLabel.textContent = 'Descanso largo';
        }
        if (circle) {
            const total = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
            const progress = Math.max(0, Math.min(1, 1 - remainingSeconds / total));
            const offset = Math.round(CIRCLE_LENGTH * (1 - progress));
            circle.style.strokeDashoffset = `${offset}`;
        }
        // Update pomodoro counters (pomodoros completed and set progress)
        try {
            if (pomodorosCountEl) pomodorosCountEl.textContent = `Pomodoros: ${completedCycles}`;
            if (pomodoroSetLabelEl) {
                const cycles = Math.max(1, settings.cyclesBeforeLongBreak);
                let inSet = completedCycles % cycles;
                if (inSet === 0 && completedCycles > 0) inSet = cycles;
                pomodoroSetLabelEl.textContent = `Set: ${inSet} / ${cycles}`;
            }
        } catch (e) { /* ignore DOM issues */ }
    }

    function playBeep() {
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
                setTimeout(() => { try { o.stop(); ctx.close(); } catch (e) {} }, 200);
            }, 150);
        } catch (e) { console.warn('Audio not available', e); }
    }

    // Función para sincronizar el timer basándose en timestamps (útil cuando la pestaña vuelve a estar visible)
    function syncTimer() {
        if (!isRunning || timerStartTime === null) return;
        
        const now = Date.now();
        const elapsed = Math.floor((now - timerStartTime) / 1000); // Segundos transcurridos
        const newRemaining = Math.max(0, timerStartRemaining - elapsed);
        
        if (newRemaining !== remainingSeconds) {
            remainingSeconds = newRemaining;
            updateDisplay();
        }
        
        // Si el timer terminó mientras estaba en segundo plano
        if (remainingSeconds <= 0) {
            finishTimer();
        }
    }
    
    function finishTimer() {
        playBeep();
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        isRunning = false;
        timerStartTime = null;
        
        // Remover advertencia cuando el timer se detiene
        if (beforeUnloadHandler) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
        
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

    function startTimer() {
        if (isRunning) return;
        isRunning = true;
        updatePlayButtonState();
        if (!sessionStart && currentStage === 'work') sessionStart = new Date();
        
        // Guardar timestamp de inicio para sincronización
        timerStartTime = Date.now();
        timerStartRemaining = remainingSeconds;
        
        // Agregar advertencia de navegación cuando el timer está corriendo
        beforeUnloadHandler = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'El Pomodoro se detendrá si abandonas esta página. ¿Estás seguro?';
            return e.returnValue;
        };
        window.addEventListener('beforeunload', beforeUnloadHandler);
        
        // Agregar listener para detectar cuando la pestaña vuelve a estar visible (solo una vez)
        if (!visibilityHandler) {
            visibilityHandler = () => {
                if (!document.hidden && isRunning) {
                    // Sincronizar el timer cuando la pestaña vuelve a estar visible
                    syncTimer();
                }
            };
            document.addEventListener('visibilitychange', visibilityHandler);
        }
        
        timerInterval = window.setInterval(() => {
            // Sincronizar periódicamente para compensar cualquier desviación
            syncTimer();
            
            // También decrementar normalmente (por si acaso)
            if (remainingSeconds > 0) {
                remainingSeconds -= 1;
            }
            
            if (remainingSeconds <= 0) {
                finishTimer();
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
        timerStartTime = null; // Limpiar timestamp
        updatePlayButtonState();
        
        // Remover advertencia cuando se pausa
        if (beforeUnloadHandler) {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
            beforeUnloadHandler = null;
        }
        
        // Nota: No removemos el visibilityHandler aquí porque puede ser útil mantenerlo
        // para cuando se reinicie el timer
    }

    function resetTimer(toStage: Stage | null = null) {
        pauseTimer(); // pauseTimer ya remueve el handler
        if (toStage) currentStage = toStage;
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        sessionStart = null;
        timerStartTime = null; // Limpiar timestamp
        timerStartRemaining = 0;
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
            } else {
                currentStage = 'short_break';
            }
        } else {
            // from break go to work
            currentStage = 'work';
        }
        remainingSeconds = (currentStage === 'work' ? settings.workMinutes : (currentStage === 'short_break' ? settings.shortBreakMinutes : settings.longBreakMinutes)) * 60;
        updateDisplay();
    }

    async function saveWorkSession(start: Date, end: Date, durationMin: number, subjectId: number | null) {
        try {
            const payload: any = {
                start_time: start.toISOString(),
                end_time: end.toISOString(),
                duration: durationMin,
            };
            // Asegurar que subjectId sea un número válido o null
            if (subjectId !== null && subjectId !== undefined && !isNaN(subjectId)) {
                payload.subject = Number(subjectId);
            }
            console.log('Saving pomodoro session with payload:', payload);
            const response = await apiPost('/pomodoro/', payload, true);
            console.log('Pomodoro session saved:', response);
            // refresh pomodoro stats y distribución
            loadPomodoroStats().catch(e => console.warn('refresh pomodoro stats failed', e));
            loadFocusDistribution().catch(e => console.warn('refresh focus distribution failed', e));
        } catch (e) {
            console.error('Failed to save pomodoro session', e);
        }
    }

    async function loadSubjectsToSelect() {
        if (!subjectSelect) return;
        try {
            const subjects: Subject[] = await apiGet('/subjects/');
            subjectSelect.innerHTML = '<option value="">-- Ninguna --</option>' + subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
            if (defaultSubjectId) subjectSelect.value = defaultSubjectId.toString();
        } catch (e) {
            console.warn('Could not load subjects for pomodoro select', e);
        }
    }
    
    // Función auxiliar para cambiar el icono del botón
    function updatePlayButtonState() {
        if (!playBtn) return;
        
        if (isRunning) {
            // Si está corriendo -> Mostrar PAUSA
            // Quitamos ml-1 porque el icono de pausa ya se ve centrado
            playBtn.innerHTML = '<i data-lucide="pause" class="w-5 h-5"></i>';
        } else {
            // Si está detenido -> Mostrar PLAY
            // Agregamos ml-1 para compensación óptica visual
            playBtn.innerHTML = '<i data-lucide="play" class="w-5 h-5 ml-1"></i>';
        }
        
        // IMPORTANTE: Renderizar el nuevo icono (si el lib está disponible)
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // UI wiring
    document.addEventListener('DOMContentLoaded', () => {
        loadSettings();
        // apply settings initial
        remainingSeconds = settings.workMinutes * 60;
        updateDisplay();
        // bind buttons
        if (playBtn) playBtn.addEventListener('click', () => {
            if (isRunning) pauseTimer(); else startTimer();
        });
        if (skipBtn) skipBtn.addEventListener('click', () => skipStage());
        if (resetBtn) resetBtn.addEventListener('click', () => { 
            completedCycles = 0; 
            resetTimer('work'); 
            updateDisplay();
        });

        // settings modal
        if (settingsBtn && modal) {
            settingsBtn.addEventListener('click', async () => {
                // populate fields
                if (workInput) workInput.value = String(settings.workMinutes);
                if (shortInput) shortInput.value = String(settings.shortBreakMinutes);
                if (longInput) longInput.value = String(settings.longBreakMinutes);
                if (cyclesInput) cyclesInput.value = String(settings.cyclesBeforeLongBreak);
                await loadSubjectsToSelect();
                if (modal) modal.style.display = 'flex';
            });
        }

        if (modalCancel && modal) modalCancel.addEventListener('click', () => { if (modal) modal.style.display = 'none'; });

        if (settingsForm && modal) settingsForm.addEventListener('submit', (e) => {
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
            if (!isRunning) resetTimer('work');
            if (modal) modal.style.display = 'none';
            // Refresh counters/UI to reflect new settings
            updateDisplay();
        });

        // initialize subject select load in background
        loadSubjectsToSelect();
    });

})();

