import { apiGet } from "./api.js";

interface Habit {
    id: number;
    name: string;
    frequency: number;
    streak: number;
    subject: number | null;
    created_at: string;
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

// Función para formatear fechas
function formatDate(dateString: string | null): string {
    if (!dateString) return "No programado";
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
    if (!priority) return "Sin prioridad";
    const priorities: { [key: number]: string } = {
        1: "Alta",
        2: "Media",
        3: "Baja"
    };
    return priorities[priority] || "Sin prioridad";
}

// Función para obtener el color de la prioridad
function getPriorityColor(priority: number | null): string {
    if (!priority) return "#71717a";
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
            loadPomodoroStats()
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
    document.addEventListener('DOMContentLoaded', loadDashboard);
} else {
    loadDashboard();
}

