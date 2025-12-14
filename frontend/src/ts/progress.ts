// Import API functions
import { apiGet } from "./api.js";

// Declare lucide icons library
declare const lucide: {
    createIcons: () => void;
};

/**
 * ==========================================
 * Progress Page Interfaces
 * ==========================================
 */

interface PomodoroSession {
    id: number;
    subject: number | null;
    start_time: string;
    end_time: string;
    duration: number;
    notes: string;
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

/**
 * ==========================================
 * Utility Functions
 * ==========================================
 */

/**
 * Get Spanish month names
 */
const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

/**
 * Format hours and minutes for display
 */
function formatHours(minutes: number): string {
    if (minutes < 60) {
        return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}m`;
}

/**
 * Get color intensity for heatmap based on hours studied
 */
function getHeatmapColor(hours: number): string {
    if (hours === 0) return '#1f2937'; // Gray-800 (darkest)
    if (hours < 1) return '#6b21a8'; // Purple-900
    if (hours < 2) return '#7c3aed'; // Purple-700
    if (hours < 4) return '#a855f7'; // Purple-500
    return '#c084fc'; // Purple-400 (brightest)
}

/**
 * ==========================================
 * Monthly Rhythm Chart (Line Chart)
 * ==========================================
 */

/**
 * Load and render monthly study rhythm line chart
 */
async function loadMonthlyRhythm() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        
        // Get last 6 months of data
        const today = new Date();
        const sixMonthsAgo = new Date(today);
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        // Filter sessions from last 6 months
        const recentSessions = sessions.filter(s => {
            const sessionDate = new Date(s.start_time);
            return sessionDate >= sixMonthsAgo;
        });
        
        // Group by month
        const monthlyHours: { [key: string]: number } = {};
        
        recentSessions.forEach(session => {
            const sessionDate = new Date(session.start_time);
            const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = `${monthNames[sessionDate.getMonth()]} ${sessionDate.getFullYear()}`;
            
            if (!monthlyHours[monthKey]) {
                monthlyHours[monthKey] = 0;
            }
            monthlyHours[monthKey] += session.duration / 60; // Convert minutes to hours
        });
        
        // Sort months chronologically
        const sortedMonths = Object.keys(monthlyHours).sort();
        const monthLabels: string[] = [];
        const monthValues: number[] = [];
        
        sortedMonths.forEach(monthKey => {
            const [year, month] = monthKey.split('-');
            monthLabels.push(`${monthNames[parseInt(month) - 1].substring(0, 3)}`);
            monthValues.push(monthlyHours[monthKey]);
        });
        
        // Render chart
        const chartContainer = document.getElementById('monthly-rhythm-chart-container');
        const chartSvg = document.getElementById('monthly-rhythm-chart');
        
        if (!chartContainer || !chartSvg) return;
        
        // Show empty state if no data
        if (monthValues.length === 0 || recentSessions.length === 0) {
            chartContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full py-12">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="trending-up" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Aún no hay datos de estudio</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">Completá sesiones de Pomodoro para ver tu ritmo de estudio mensual.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        const width = chartContainer.clientWidth - 40;
        const height = 240;
        const padding = { top: 20, right: 20, bottom: 40, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        const maxHours = Math.max(...monthValues, 1);
        const step = chartWidth / Math.max(1, monthValues.length - 1);
        
        // Generate smooth curve path
        let pathD = '';
        const points: { x: number; y: number }[] = [];
        
        monthValues.forEach((hours, index) => {
            const x = padding.left + (index * step);
            const y = padding.top + chartHeight - (hours / maxHours) * chartHeight;
            points.push({ x, y });
        });
        
        // Create smooth path with curves (tension 0.4)
        let areaPathD = '';
        let linePathD = '';
        if (points.length > 1) {
            // Start line path
            linePathD = `M ${points[0].x} ${points[0].y}`;
            areaPathD = `M ${points[0].x} ${points[0].y}`;
            
            for (let i = 1; i < points.length; i++) {
                const prev = points[i - 1];
                const curr = points[i];
                const cp1x = prev.x + (curr.x - prev.x) * 0.4;
                const cp1y = prev.y;
                const cp2x = curr.x - (curr.x - prev.x) * 0.4;
                const cp2y = curr.y;
                const curve = ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
                linePathD += curve;
                areaPathD += curve;
            }
            
            // Add area fill (gradient fill below line)
            const lastPoint = points[points.length - 1];
            const firstPoint = points[0];
            areaPathD += ` L ${lastPoint.x} ${padding.top + chartHeight}`;
            areaPathD += ` L ${firstPoint.x} ${padding.top + chartHeight}`;
            areaPathD += ` Z`;
            
            pathD = areaPathD;
        }
        
        // Render SVG
        chartSvg.setAttribute('width', width.toString());
        chartSvg.setAttribute('height', height.toString());
        chartSvg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        
        chartSvg.innerHTML = `
            <!-- Grid lines -->
            ${Array.from({ length: 5 }, (_, i) => {
                const y = padding.top + (chartHeight / 4) * i;
                return `<line x1="${padding.left}" y1="${y}" x2="${padding.left + chartWidth}" y2="${y}" stroke="#1e212b" stroke-width="1" />`;
            }).join('')}
            
            <!-- Area fill with gradient -->
            <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="#a855f7" stop-opacity="0.3"/>
                    <stop offset="100%" stop-color="#a855f7" stop-opacity="0.05"/>
                </linearGradient>
            </defs>
            <path d="${pathD}" fill="url(#lineGradient)" />
            
            <!-- Line (smooth curve) -->
            <path d="${linePathD}" 
                  fill="none" 
                  stroke="#a855f7" 
                  stroke-width="3" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" />
            
            <!-- Data points -->
            ${points.map((p, index) => {
                const hours = monthValues[index];
                return `
                    <g>
                        <circle cx="${p.x}" cy="${p.y}" r="5" fill="#1e212b" stroke="#a855f7" stroke-width="2" 
                                class="cursor-pointer hover:r-7 transition-all" 
                                data-month="${monthLabels[index]}" 
                                data-hours="${hours.toFixed(1)}"/>
                        <title>${monthLabels[index]}: ${hours.toFixed(1)}h</title>
                    </g>
                `;
            }).join('')}
            
            <!-- X-axis labels -->
            ${monthLabels.map((label, index) => {
                const x = padding.left + (index * step);
                return `<text x="${x}" y="${height - 10}" text-anchor="middle" fill="#6b7280" font-size="10">${label}</text>`;
            }).join('')}
            
            <!-- Y-axis labels -->
            ${Array.from({ length: 5 }, (_, i) => {
                const y = padding.top + (chartHeight / 4) * (4 - i);
                const value = (maxHours / 4) * i;
                return `<text x="${padding.left - 10}" y="${y + 4}" text-anchor="end" fill="#6b7280" font-size="10">${value.toFixed(1)}h</text>`;
            }).join('')}
        `;
        
        // Add interactive tooltips
        const circles = chartSvg.querySelectorAll('circle');
        circles.forEach((circle, index) => {
            const hours = monthValues[index];
            const month = monthLabels[index];
            
            circle.addEventListener('mouseenter', (e: Event) => {
                const mouseEvent = e as MouseEvent;
                const tooltip = document.createElement('div');
                tooltip.id = 'rhythm-tooltip';
                tooltip.className = 'fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none';
                tooltip.innerHTML = `
                    <div class="font-bold text-purple-400">${month}</div>
                    <div class="text-gray-300">${hours.toFixed(1)} horas</div>
                `;
                document.body.appendChild(tooltip);
                
                updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
            });
            
            circle.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('rhythm-tooltip');
                if (tooltip) tooltip.remove();
            });
            
            circle.addEventListener('mousemove', (e: Event) => {
                const mouseEvent = e as MouseEvent;
                const tooltip = document.getElementById('rhythm-tooltip');
                if (tooltip) {
                    updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                }
            });
        });
    } catch (error) {
        console.error("Error loading monthly rhythm:", error);
    }
}

/**
 * ==========================================
 * Weekly Consistency Card
 * ==========================================
 */

/**
 * Load and render weekly consistency percentage
 */
async function loadWeeklyConsistency() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        
        // Get last 7 days
        const today = new Date();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        
        // Count days with at least one session
        const daysWithStudy = new Set<string>();
        sessions.forEach(session => {
            const sessionDate = new Date(session.start_time);
            sessionDate.setHours(0, 0, 0, 0);
            if (sessionDate >= weekAgo && sessionDate <= today) {
                const dayKey = sessionDate.toISOString().split('T')[0];
                daysWithStudy.add(dayKey);
            }
        });
        
        // Calculate percentage (days with study / 7)
        const consistencyPercentage = Math.round((daysWithStudy.size / 7) * 100);
        
        // Update circular progress
        const consistencyCard = document.querySelector('.bg-dark-card.animate-on-load.delay-400');
        const circle = document.getElementById('consistency-progress-circle');
        const percentageEl = document.getElementById('consistency-percentage');
        const feedbackEl = document.getElementById('consistency-feedback');
        
        // Show empty state if no data
        if (sessions.length === 0 && consistencyCard) {
            const cardContent = consistencyCard.querySelector('.flex.flex-col');
            if (cardContent) {
                cardContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="target" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">Sin datos de constancia</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">Completá sesiones de Pomodoro para ver tu constancia semanal.</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
        }
        
        if (circle) {
            const circumference = 2 * Math.PI * 70; // radius = 70
            const offset = circumference - (consistencyPercentage / 100) * circumference;
            circle.setAttribute('stroke-dashoffset', offset.toString());
        }
        
        if (percentageEl) {
            percentageEl.textContent = `${consistencyPercentage}%`;
        }
        
        if (feedbackEl) {
            let feedback = '';
            if (consistencyPercentage >= 85) {
                feedback = '¡Excelente constancia!';
            } else if (consistencyPercentage >= 70) {
                feedback = 'Muy buena constancia';
            } else if (consistencyPercentage >= 50) {
                feedback = 'Buen ritmo, sigue así';
            } else if (consistencyPercentage >= 30) {
                feedback = 'Puedes mejorar tu constancia';
            } else {
                feedback = 'Intenta estudiar más días';
            }
            feedbackEl.textContent = feedback;
        }
    } catch (error) {
        console.error("Error loading weekly consistency:", error);
    }
}

/**
 * ==========================================
 * Monthly Focus Distribution (Donut Chart)
 * ==========================================
 */

/**
 * Load and render monthly focus distribution donut chart
 */
async function loadMonthlyFocusDistribution() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        const subjects: Subject[] = await apiGet("/subjects/");
        
        // Get last 30 days
        const today = new Date();
        const monthAgo = new Date(today);
        monthAgo.setDate(monthAgo.getDate() - 30);
        
        const monthlySessions = sessions.filter(s => {
            const sessionDate = new Date(s.start_time);
            return sessionDate >= monthAgo;
        });
        
        // Group minutes by subject
        const subjectMinutes: { [key: number]: number } = {};
        let totalMinutes = 0;
        
        monthlySessions.forEach(session => {
            let subjectId: number | null = null;
            if (session.subject !== null && session.subject !== undefined) {
                subjectId = typeof session.subject === 'string' ? parseInt(session.subject) : session.subject;
            }
            
            const key = subjectId !== null && !isNaN(subjectId) ? subjectId : -1;
            
            if (!subjectMinutes[key]) {
                subjectMinutes[key] = 0;
            }
            subjectMinutes[key] += session.duration;
            totalMinutes += session.duration;
        });
        
        // Create array of subjects with minutes
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
        const colors = ['#a855f7', '#60a5fa', '#34d399', '#fbbf24', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4'];
        
        // Generate conic gradient
        let conicGradient = '';
        let currentPercent = 0;
        
        subjectData.forEach((subject, index) => {
            const color = subject.id === -1 ? '#4b5563' : colors[index % colors.length]; // Gray for "Sin materia"
            const startPercent = currentPercent;
            const endPercent = currentPercent + subject.percentage;
            conicGradient += `${color} ${startPercent}% ${endPercent}%, `;
            currentPercent = endPercent;
        });
        
        // Update distribution chart
        const donutChart = document.getElementById('focus-distribution-donut');
        const donutChartParent = donutChart?.parentElement;
        
        if (donutChart && donutChartParent) {
            // Show empty state if no data
            if (monthlySessions.length === 0 || subjectData.length === 0) {
                donutChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="pie-chart" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">Sin distribución de enfoque</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">Completá sesiones de Pomodoro con materias asignadas para ver cómo distribuis tu tiempo de estudio.</p>
                    </div>
                `;
                if (typeof lucide !== 'undefined') lucide.createIcons();
                return;
            }
            
            // Apply conic gradient to donut chart
            (donutChart as HTMLElement).style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
            
            // Update total hours display
            const totalHoursEl = document.getElementById('focus-total-hours-month');
            if (totalHoursEl) {
                totalHoursEl.textContent = formatHours(totalMinutes);
            }
            
            // Update legend
            const legendContainer = document.getElementById('focus-legend-month');
            if (legendContainer) {
                legendContainer.innerHTML = subjectData.map((subject, index) => {
                    const color = subject.id === -1 ? '#4b5563' : colors[index % colors.length];
                    return `
                        <div class="flex items-center gap-1">
                            <span class="w-2 h-2 rounded-full" style="background-color: ${color}"></span>
                            <span class="text-xs text-gray-400">${subject.name}</span>
                        </div>
                    `;
                }).join('');
            }
        }
    } catch (error) {
        console.error("Error loading monthly focus distribution:", error);
    }
}

/**
 * ==========================================
 * Study Heatmap
 * ==========================================
 */

/**
 * Load and render study heatmap (GitHub-style: last year or 3 months)
 */
async function loadStudyHeatmap() {
    try {
        const sessions: PomodoroSession[] = await apiGet("/pomodoro/");
        
        // Get last year of data (or 3 months if preferred)
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        const startDate = new Date(today);
        startDate.setFullYear(startDate.getFullYear() - 1);
        startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday of that week
        
        // Group sessions by date
        const dailyHours: { [key: string]: number } = {};
        let totalContributions = 0;
        
        sessions.forEach(session => {
            const sessionDate = new Date(session.start_time);
            if (sessionDate >= startDate && sessionDate <= today) {
                const dateKey = sessionDate.toISOString().split('T')[0];
                if (!dailyHours[dateKey]) {
                    dailyHours[dateKey] = 0;
                }
                const hours = session.duration / 60;
                dailyHours[dateKey] += hours;
            }
        });
        
        // Count days with activity
        totalContributions = Object.values(dailyHours).filter(hours => hours > 0).length;
        
        const heatmapContainer = document.getElementById('heatmap-container');
        const heatmapGrid = document.getElementById('heatmap-grid');
        const heatmapTotal = document.getElementById('heatmap-total');
        
        if (!heatmapContainer || !heatmapGrid) return;
        
        // Show empty state if no data
        if (Object.keys(dailyHours).length === 0 || sessions.length === 0) {
            heatmapContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 w-full">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="calendar" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">Sin actividad de estudio</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">Completá sesiones de Pomodoro para ver tu mapa de calor de estudio.</p>
                </div>
            `;
            if (typeof lucide !== 'undefined') lucide.createIcons();
            return;
        }
        
        // Update total contributions
        if (heatmapTotal) {
            const totalHours = Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);
            heatmapTotal.textContent = `${totalContributions} días con estudio en el último año`;
        }
        
        // Organize by weeks (Sunday to Saturday)
        const weeks: Date[][] = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= today) {
            const week: Date[] = [];
            // Get Sunday of this week
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
            
            // Add all 7 days of the week
            for (let i = 0; i < 7; i++) {
                const day = new Date(weekStart);
                day.setDate(day.getDate() + i);
                if (day <= today) {
                    week.push(day);
                }
            }
            
            if (week.length > 0) {
                weeks.push(week);
            }
            
            // Move to next week
            currentDate.setDate(currentDate.getDate() + 7);
        }
        
        // Get month labels
        const monthLabels: { month: number; weekIndex: number }[] = [];
        const seenMonths = new Set<number>();
        
        weeks.forEach((week, weekIndex) => {
            const firstDay = week[0];
            const month = firstDay.getMonth();
            if (!seenMonths.has(month) || weekIndex === 0) {
                monthLabels.push({ month, weekIndex });
                seenMonths.add(month);
            }
        });
        
        // Build heatmap HTML
        let heatmapHTML = '<div class="flex items-start gap-1 w-full">';
        
        // Day labels column
        heatmapHTML += '<div class="flex flex-col gap-1 pt-5 flex-shrink-0">';
        const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        dayLabels.forEach((label, dayIndex) => {
            if (dayIndex % 2 === 0) { // Show only some days to save space
                heatmapHTML += `<div class="heatmap-day-label" style="height: 11px; line-height: 11px; padding-top: 1px;">${label}</div>`;
            } else {
                heatmapHTML += `<div class="heatmap-day-label" style="height: 11px;"></div>`;
            }
        });
        heatmapHTML += '</div>';
        
        // Weeks and months
        heatmapHTML += '<div class="flex gap-0.5 flex-1 min-w-0">';
        
        weeks.forEach((week, weekIndex) => {
            // Check if this week starts a new month
            const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);
            const monthName = monthLabel ? monthNames[monthLabel.month].substring(0, 3) : '';
            
            heatmapHTML += '<div class="flex flex-col flex-shrink-0">';
            
            // Month label
            if (monthLabel) {
                heatmapHTML += `<div class="heatmap-month-label">${monthName}</div>`;
            } else {
                heatmapHTML += '<div class="heatmap-month-label"></div>';
            }
            
            // Week column
            heatmapHTML += '<div class="heatmap-week">';
            // Week should already have 7 days (Sunday to Saturday)
            week.forEach(day => {
                const dateKey = day.toISOString().split('T')[0];
                const hours = dailyHours[dateKey] || 0;
                const color = getHeatmapColor(hours);
                const dateStr = day.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                
                heatmapHTML += `
                    <div class="heatmap-cell" 
                         style="background-color: ${color};" 
                         data-date="${dateKey}"
                         data-hours="${hours.toFixed(1)}"
                         title="${dateStr}: ${hours.toFixed(1)}h estudiadas">
                    </div>
                `;
            });
            heatmapHTML += '</div>'; // End week
            heatmapHTML += '</div>'; // End week column
        });
        
        heatmapHTML += '</div>'; // End weeks container
        heatmapHTML += '</div>'; // End main container
        
        heatmapGrid.innerHTML = heatmapHTML;
        
        // Add tooltips on hover
        const heatmapCells = heatmapGrid.querySelectorAll('.heatmap-cell');
        heatmapCells.forEach(cell => {
            cell.addEventListener('mouseenter', (e: Event) => {
                const mouseEvent = e as MouseEvent;
                const tooltip = document.createElement('div');
                tooltip.id = 'heatmap-tooltip';
                tooltip.className = 'fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none';
                const date = (cell as HTMLElement).getAttribute('data-date');
                const hours = (cell as HTMLElement).getAttribute('data-hours');
                if (date) {
                    const dateObj = new Date(date);
                    const dateStr = dateObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                    const hoursNum = parseFloat(hours || '0');
                    tooltip.innerHTML = `
                        <div class="font-bold text-purple-400">${hoursNum > 0 ? hoursNum.toFixed(1) + 'h estudiadas' : 'Sin estudio'}</div>
                        <div class="text-gray-300">${dateStr}</div>
                    `;
                }
                document.body.appendChild(tooltip);
                updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
            });
            
            cell.addEventListener('mouseleave', () => {
                const tooltip = document.getElementById('heatmap-tooltip');
                if (tooltip) tooltip.remove();
            });
            
            cell.addEventListener('mousemove', (e: Event) => {
                const mouseEvent = e as MouseEvent;
                const tooltip = document.getElementById('heatmap-tooltip');
                if (tooltip) {
                    updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                }
            });
        });
    } catch (error) {
        console.error("Error loading study heatmap:", error);
    }
}

/**
 * ==========================================
 * Helper Functions
 * ==========================================
 */

/**
 * Update tooltip position near cursor
 */
function updateTooltipPosition(tooltip: HTMLElement, mouseX: number, mouseY: number) {
    const tooltipRect = tooltip.getBoundingClientRect();
    const offset = 15;
    
    let left = mouseX + offset;
    let top = mouseY - tooltipRect.height - offset;
    
    if (left + tooltipRect.width > window.innerWidth - 10) {
        left = mouseX - tooltipRect.width - offset;
    }
    if (left < 10) {
        left = 10;
    }
    
    if (top < 10) {
        top = mouseY + offset;
    }
    if (top + tooltipRect.height > window.innerHeight - 10) {
        top = window.innerHeight - tooltipRect.height - 10;
    }
    
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
}

/**
 * ==========================================
 * Main Load Function
 * ==========================================
 */

/**
 * Load all progress data
 */
async function loadProgress() {
    try {
        await Promise.all([
            loadMonthlyRhythm(),
            loadWeeklyConsistency(),
            loadMonthlyFocusDistribution(),
            loadStudyHeatmap()
        ]);
    } catch (error) {
        console.error("Error loading progress:", error);
    }
}

/**
 * Initialize progress page when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProgress);
} else {
    loadProgress();
}
