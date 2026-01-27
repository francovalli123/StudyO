var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Import API functions
import { apiGet, getCurrentUser } from "./api.js";
import { t, translations, getCurrentLanguage } from "./i18n.js";
/**
 * ==========================================
 * Utility Functions
 * ==========================================
 */
/**
 * Format hours and minutes for display
 */
function formatHours(minutes) {
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
function getHeatmapColor(hours) {
    if (hours === 0)
        return '#1f2937'; // Gray-800 (darkest)
    if (hours < 1)
        return '#6b21a8'; // Purple-900
    if (hours < 2)
        return '#7c3aed'; // Purple-700
    if (hours < 4)
        return '#a855f7'; // Purple-500
    return '#c084fc'; // Purple-400 (brightest)
}
/**
 * Format date string for display
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
    });
}
/**
 * ==========================================
 * Monthly Rhythm Chart (Line Chart)
 * ==========================================
 */
/**
 * Load and render monthly study rhythm line chart
 */
function loadMonthlyRhythm() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const currentUser = yield getCurrentUser();
        const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
        try {
            const sessions = yield apiGet("/pomodoro/");
            const trans = t();
            const currentLang = getCurrentLanguage();
            // Fecha de hoy según timezone del usuario
            const now = new Date();
            const localNow = new Date(now.toLocaleString("en-US", { timeZone: currentUser.timezone }));
            // Fecha de hace 6 meses, al inicio del mes
            const sixMonthsAgo = new Date(localNow);
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            sixMonthsAgo.setDate(1);
            sixMonthsAgo.setHours(0, 0, 0, 0);
            // Filtrar sesiones de los últimos 6 meses según timezone
            const recentSessions = sessions.filter(session => {
                const sessionDate = new Date(new Date(session.start_time).toLocaleString("en-US", { timeZone: currentUser.timezone }));
                return sessionDate >= sixMonthsAgo;
            });
            // Agrupar por mes calendario
            const monthlyHours = {};
            recentSessions.forEach(session => {
                const sessionDate = new Date(new Date(session.start_time).toLocaleString("en-US", { timeZone: currentUser.timezone }));
                const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, "0")}`;
                monthlyHours[monthKey] = (monthlyHours[monthKey] || 0) + session.duration / 60;
            });
            // Ordenar meses cronológicamente
            const sortedMonths = Object.keys(monthlyHours).sort();
            const monthLabels = [];
            const monthValues = [];
            sortedMonths.forEach(monthKey => {
                const [year, month] = monthKey.split("-");
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                // Formatear mes según idioma del usuario
                const localizedMonth = dateObj.toLocaleDateString(currentLang, { month: "short" });
                const formattedLabel = localizedMonth.charAt(0).toUpperCase() + localizedMonth.slice(1);
                monthLabels.push(formattedLabel);
                monthValues.push(monthlyHours[monthKey]);
            });
            // Render chart
            const chartContainer = document.getElementById('monthly-rhythm-chart-container');
            const chartSvg = document.getElementById('monthly-rhythm-chart');
            if (!chartContainer || !chartSvg)
                return;
            // Show empty state if no data
            if (monthValues.length === 0 || recentSessions.length === 0) {
                const trans = translations[getCurrentLanguage()];
                chartContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center h-full py-12">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="trending-up" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${trans.progress.monthlyRhythm}</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">${trans.progress.monthlyRhythmDesc}</p>
                </div>
            `;
                if (typeof lucide !== 'undefined')
                    lucide.createIcons();
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
            const points = [];
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
                circle.addEventListener('mouseenter', (e) => {
                    const mouseEvent = e;
                    const tooltip = document.createElement('div');
                    tooltip.id = 'rhythm-tooltip';
                    tooltip.className = 'fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none';
                    tooltip.innerHTML = `
                    <div class="font-bold text-purple-400">${month}</div>
                    <div class="text-gray-300">${hours.toFixed(1)} ${trans.progress.hours}</div>
                `;
                    document.body.appendChild(tooltip);
                    updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                });
                circle.addEventListener('mouseleave', () => {
                    const tooltip = document.getElementById('rhythm-tooltip');
                    if (tooltip)
                        tooltip.remove();
                });
                circle.addEventListener('mousemove', (e) => {
                    const mouseEvent = e;
                    const tooltip = document.getElementById('rhythm-tooltip');
                    if (tooltip) {
                        updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                    }
                });
            });
        }
        catch (error) {
            console.error("Error loading monthly rhythm:", error);
        }
    });
}
/**
 * ==========================================
 * Weekly Consistency Card
 * ==========================================
 */
function getDayOfWeekInTimezone(date, timeZone) {
    // Convierte la fecha a la zona horaria del usuario
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
    const day = tzDate.getDay(); // 0 = domingo, 1 = lunes, ..., 6 = sábado
    return day === 0 ? 7 : day; // hacemos que lunes=1 ... domingo=7
}
/**
 * Load and render weekly consistency percentage
 */
function loadWeeklyConsistency() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const currentUser = yield getCurrentUser();
        try {
            const sessions = yield apiGet("/pomodoro/");
            // Obtener la fecha actual en timezone del usuario
            const now = new Date();
            const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            const dayOfWeek = getDayOfWeekInTimezone(now, userTimezone);
            // Calcular lunes de esta semana
            const mondayDate = new Date(now);
            const diff = dayOfWeek - 1; // cuántos días restar para llegar al lunes
            mondayDate.setDate(now.getDate() - diff);
            mondayDate.setHours(0, 0, 0, 0);
            // Contar días con al menos una sesión desde lunes
            const daysWithStudy = new Set();
            sessions.forEach(session => {
                const sessionDate = new Date(session.start_time);
                // Convertir sessionDate a timezone del usuario
                const sessionFormatter = new Intl.DateTimeFormat('en-US', {
                    timeZone: userTimezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                });
                const dayKey = sessionFormatter.format(sessionDate);
                const sessionDateOnly = new Date(dayKey);
                if (sessionDateOnly >= mondayDate && sessionDateOnly <= now) {
                    daysWithStudy.add(dayKey);
                }
            });
            // Número de días hasta hoy desde lunes
            const totalDays = (Math.floor((now.getTime() - mondayDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);
            const consistencyPercentage = Math.round((daysWithStudy.size / 7) * 100);
            // === Actualizar UI ===
            const consistencyCard = document.querySelector('.bg-dark-card.animate-on-load.delay-400');
            const circle = document.getElementById('consistency-progress-circle');
            const percentageEl = document.getElementById('consistency-percentage');
            const feedbackEl = document.getElementById('consistency-feedback');
            if (circle) {
                const circumference = 2 * Math.PI * 70;
                const offset = circumference - (consistencyPercentage / 100) * circumference;
                circle.setAttribute('stroke-dashoffset', offset.toString());
            }
            if (percentageEl)
                percentageEl.textContent = `${consistencyPercentage}%`;
            if (feedbackEl) {
                const lang = getCurrentLanguage();
                const feedbackMap = {
                    es: ['¡Excelente constancia!', 'Muy buena constancia', 'Buen ritmo, sigue así', 'Puedes mejorar tu constancia', 'Intenta estudiar más días'],
                    en: ['Excellent consistency!', 'Very good consistency', 'Good pace, keep it up', 'You can improve your consistency', 'Try to study more days'],
                    zh: ['极佳的坚持！', '非常好的坚持', '节奏不错，继续保持', '可以提升坚持度', '尝试更多天学习'],
                    pt: ['Consistência excelente!', 'Muito boa consistência', 'Bom ritmo, continue assim', 'Você pode melhorar a constância', 'Tente estudar mais dias'],
                };
                const texts = feedbackMap[lang] || feedbackMap.es;
                let feedback = '';
                if (consistencyPercentage >= 85)
                    feedback = texts[0];
                else if (consistencyPercentage >= 70)
                    feedback = texts[1];
                else if (consistencyPercentage >= 50)
                    feedback = texts[2];
                else if (consistencyPercentage >= 30)
                    feedback = texts[3];
                else
                    feedback = texts[4];
                feedbackEl.textContent = feedback;
            }
        }
        catch (error) {
            console.error("Error loading weekly consistency:", error);
        }
    });
}
/**
 * ==========================================
 * Monthly Focus Distribution (Donut Chart)
 * ==========================================
 */
/**
 * Load and render monthly focus distribution donut chart
 * Reinicia cada mes según el timezone del usuario
 */
function loadMonthlyFocusDistribution() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const trans = t();
        const currentUser = yield getCurrentUser();
        try {
            const sessions = yield apiGet("/pomodoro/");
            const subjects = yield apiGet("/subjects/");
            const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            const now = new Date();
            // Helper: obtener año, mes y día en timezone del usuario
            function getYearMonthDay(date, timeZone) {
                const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
                return {
                    year: tzDate.getFullYear(),
                    month: tzDate.getMonth(), // 0 = enero
                    day: tzDate.getDate()
                };
            }
            const { year: currentYear, month: currentMonth } = getYearMonthDay(now, userTimezone);
            // Filtrar sesiones que pertenezcan al mes actual del usuario
            const monthlySessions = sessions.filter(s => {
                if (!s || !s.start_time || typeof s.duration !== 'number')
                    return false;
                const sessionDate = new Date(s.start_time);
                if (isNaN(sessionDate.getTime()))
                    return false;
                // Convertir sesión a timezone del usuario
                const { year, month } = getYearMonthDay(sessionDate, userTimezone);
                return year === currentYear && month === currentMonth;
            });
            // Agrupar minutos por materia
            const subjectMinutes = {};
            let totalMinutes = 0;
            monthlySessions.forEach(session => {
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
            // Crear array de materias con minutos y porcentaje
            const subjectData = subjects
                .filter(s => subjectMinutes[s.id] && subjectMinutes[s.id] > 0)
                .map(s => ({
                id: s.id,
                name: s.name,
                minutes: subjectMinutes[s.id],
                percentage: totalMinutes > 0 ? (subjectMinutes[s.id] / totalMinutes) * 100 : 0
            }))
                .sort((a, b) => b.minutes - a.minutes);
            // Añadir sesiones "sin materia" si hay
            if (subjectMinutes[-1] && subjectMinutes[-1] > 0) {
                subjectData.push({
                    id: -1,
                    name: trans.dashboard.focusDistributionNoSubject,
                    minutes: subjectMinutes[-1],
                    percentage: totalMinutes > 0 ? (subjectMinutes[-1] / totalMinutes) * 100 : 0
                });
            }
            // Colores para el gráfico
            const colors = ['#a855f7', '#60a5fa', '#34d399', '#fbbf24', '#ec4899', '#8b5cf6', '#f97316', '#06b6d4'];
            // Generar conic gradient
            let conicGradient = '';
            let currentPercent = 0;
            subjectData.forEach((subject, index) => {
                const color = subject.id === -1 ? '#4b5563' : colors[index % colors.length];
                const startPercent = currentPercent;
                const endPercent = currentPercent + subject.percentage;
                conicGradient += `${color} ${startPercent}% ${endPercent}%, `;
                currentPercent = endPercent;
            });
            // Actualizar gráfico
            const donutChart = document.getElementById('focus-distribution-donut');
            const donutChartParent = donutChart === null || donutChart === void 0 ? void 0 : donutChart.parentElement;
            if (donutChart && donutChartParent) {
                // Estado vacío si no hay sesiones del mes
                if (monthlySessions.length === 0 || subjectData.length === 0) {
                    donutChartParent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="pie-chart" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">${trans.progress.monthlyFocus}</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">${trans.progress.monthlyFocusDesc}</p>
                    </div>
                `;
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
                    return;
                }
                // Aplicar conic gradient
                donutChart.style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
                // Actualizar horas totales
                const totalHoursEl = document.getElementById('focus-total-hours-month');
                if (totalHoursEl)
                    totalHoursEl.textContent = formatHours(totalMinutes);
                // Actualizar leyenda
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
        }
        catch (error) {
            console.error("Error loading monthly focus distribution:", error);
        }
    });
}
/**
 * ==========================================
 * Study Heatmap
 * ==========================================
 */
// Load and render study heatmap (Fixed: Dec on Right & Strict Year Labels)
function loadStudyHeatmap() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const currentUser = yield getCurrentUser();
        try {
            const sessions = yield apiGet("/pomodoro/");
            const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            const heatmapContainer = document.getElementById('heatmap-container');
            const oldTotal = document.getElementById('heatmap-total');
            if (oldTotal)
                oldTotal.style.display = 'none';
            if (!heatmapContainer)
                return;
            // --- Helper fecha ---
            function getYearMonthDay(date, timeZone) {
                const tzDate = new Date(date.toLocaleString('en-US', { timeZone }));
                return {
                    year: tzDate.getFullYear(),
                    month: tzDate.getMonth(),
                    day: tzDate.getDate()
                };
            }
            const now = new Date();
            const { year: currentYear } = getYearMonthDay(now, userTimezone);
            // ---------------------------------------------------------
            // Función de Renderizado
            // ---------------------------------------------------------
            const render = (yearToRender) => {
                const startDate = new Date(Date.UTC(yearToRender, 0, 1, 0, 0, 0));
                const endDate = new Date(Date.UTC(yearToRender, 11, 31, 23, 59, 59));
                // Procesar datos
                const dailyHours = {};
                sessions.forEach(session => {
                    if (!session || !session.start_time || typeof session.duration !== 'number')
                        return;
                    const sessionDate = new Date(session.start_time);
                    const { year, month, day } = getYearMonthDay(sessionDate, userTimezone);
                    if (year !== yearToRender)
                        return;
                    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    if (!dailyHours[dateKey])
                        dailyHours[dateKey] = 0;
                    dailyHours[dateKey] += session.duration / 60;
                });
                const totalContributions = Object.values(dailyHours).filter(h => h > 0).length;
                const lang = getCurrentLanguage();
                const transMap = {
                    es: { title: 'días con estudio en el año', mon: 'Lun', wed: 'Mié', fri: 'Vie', less: 'Menos', more: 'Más' },
                    en: { title: 'days with study in the year', mon: 'Mon', wed: 'Wed', fri: 'Fri', less: 'Less', more: 'More' },
                    pt: { title: 'dias com estudo no ano', mon: 'Seg', wed: 'Qua', fri: 'Sex', less: 'Menos', more: 'Mais' },
                    zh: { title: '天有学习记录', mon: '一', wed: '三', fri: '五', less: '少', more: '多' }
                };
                const t = transMap[lang] || transMap.es;
                // --- Construcción de Semanas ---
                const weeks = [];
                let currentDate = new Date(startDate);
                const dayOfWeek = currentDate.getUTCDay();
                // Retroceder al domingo anterior para empezar la grilla correctamente
                currentDate.setUTCDate(currentDate.getUTCDate() - dayOfWeek);
                while (currentDate <= endDate || weeks.length < 53) {
                    const week = [];
                    for (let i = 0; i < 7; i++) {
                        week.push(new Date(currentDate));
                        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
                    }
                    weeks.push(week);
                    if (week[0] > endDate)
                        break;
                }
                // --- Etiquetas de Meses (CORREGIDO: Solo año actual) ---
                const monthLabels = [];
                weeks.forEach((week, idx) => {
                    // Buscamos si el día 1 de CUALQUIER mes cae en esta semana
                    // Y IMPORTANTE: Que ese día 1 pertenezca al año que estamos renderizando (yearToRender)
                    // Esto evita que "Diciembre" del año anterior aparezca a la izquierda.
                    const firstDayOfTargetYearMonth = week.find(d => d.getUTCDate() === 1 &&
                        d.getUTCFullYear() === yearToRender);
                    if (firstDayOfTargetYearMonth) {
                        const mName = firstDayOfTargetYearMonth.toLocaleDateString(lang === 'es' ? 'es-AR' : lang, { month: 'short' });
                        monthLabels.push({ name: mName, weekIdx: idx });
                    }
                });
                // Grid HTML
                let gridHTML = `<div class="flex flex-col gap-1 w-full min-w-max">`;
                // 1. Fila de etiquetas de MESES
                gridHTML += `<div class="flex gap-[2px] text-[10px] text-gray-400 mb-1 pl-8">`;
                weeks.forEach((_, idx) => {
                    const label = monthLabels.find(m => m.weekIdx === idx);
                    // width: 10px coincide con la celda
                    gridHTML += `<div style="width: 10px; overflow:visible; white-space:nowrap;">${label ? label.name : ''}</div>`;
                });
                gridHTML += `</div>`;
                gridHTML += `<div class="flex items-start">`;
                // 2. Columna etiquetas DÍAS (Sticky left, sin fondo)
                gridHTML += `<div class="flex flex-col gap-[3px] pr-2 text-[10px] text-gray-500 pt-[14px] flex-shrink-0 sticky left-0 z-10">`;
                const dayNames = ['', t.mon, '', t.wed, '', t.fri, ''];
                dayNames.forEach(d => {
                    gridHTML += `<div style="height: 10px; line-height: 10px;">${d}</div>`;
                });
                gridHTML += `</div>`;
                // 3. Celdas (Semanas como columnas)
                gridHTML += `<div class="flex gap-[2px]">`;
                weeks.forEach(week => {
                    gridHTML += `<div class="flex flex-col gap-[2px]">`;
                    week.forEach(dayObj => {
                        const { year, month, day } = getYearMonthDay(dayObj, userTimezone);
                        const isTargetYear = year === yearToRender;
                        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const hours = (isTargetYear && dailyHours[dateKey]) ? dailyHours[dateKey] : 0;
                        let color = isTargetYear ? getHeatmapColor(hours) : 'rgba(255,255,255,0.03)';
                        if (hours === 0 && isTargetYear)
                            color = 'rgba(255,255,255,0.08)';
                        const dateStr = dayObj.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
                        gridHTML += `
                        <div class="heatmap-cell rounded-[2px]" 
                             style="width: 10px; height: 10px; background-color: ${color};"
                             data-date="${dateKey}"
                             data-hours="${hours.toFixed(1)}"
                             title="${dateStr}: ${hours.toFixed(1)}h">
                        </div>
                    `;
                    });
                    gridHTML += `</div>`;
                });
                gridHTML += `</div></div></div>`;
                // --- Layout Principal ---
                const mainLayout = `
                <div class="flex flex-col w-full">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-white font-semibold text-sm">
                            ${totalContributions} ${t.title}
                        </h3>
                    </div>

                    <div class="w-full overflow-x-auto pb-2">
                            ${gridHTML}
                    </div>

                    <div class="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <a href="#" class="hover:text-purple-400 transition-colors">Learn how we count contributions</a>
                        <div class="flex items-center gap-1">
                            <span>${t.less}</span>
                            <div style="width:10px; height:10px; background-color: rgba(255,255,255,0.08);" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${getHeatmapColor(0.5)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${getHeatmapColor(2)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${getHeatmapColor(4)};" class="rounded-[2px]"></div>
                            <div style="width:10px; height:10px; background-color: ${getHeatmapColor(8)};" class="rounded-[2px]"></div>
                            <span>${t.more}</span>
                        </div>
                    </div>
                </div>
            `;
                heatmapContainer.innerHTML = mainLayout;
                attachTooltips(heatmapContainer, lang);
            };
            render(currentYear);
            function attachTooltips(container, lang) {
                const heatmapCells = container.querySelectorAll('.heatmap-cell');
                heatmapCells.forEach(cell => {
                    cell.addEventListener('mouseenter', (e) => {
                        const mouseEvent = e;
                        let tooltip = document.getElementById('heatmap-tooltip');
                        if (!tooltip) {
                            tooltip = document.createElement('div');
                            tooltip.id = 'heatmap-tooltip';
                            tooltip.className = 'fixed bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white shadow-xl z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mt-[-8px]';
                            document.body.appendChild(tooltip);
                        }
                        const date = cell.getAttribute('data-date');
                        const hours = cell.getAttribute('data-hours');
                        if (date) {
                            const dateObj = new Date(date);
                            const utcDate = new Date(dateObj.getUTCFullYear(), dateObj.getUTCMonth(), dateObj.getUTCDate());
                            const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang === 'zh' ? 'zh-CN' : 'es-AR';
                            const dateStr = utcDate.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
                            const hoursNum = parseFloat(hours || '0');
                            tooltip.innerHTML = `<span class="font-semibold text-white">${hoursNum > 0 ? hoursNum.toFixed(1) + ' hours' : 'No study'}</span> <span class="text-gray-400">on ${dateStr}</span>`;
                            updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                        }
                    });
                    cell.addEventListener('mouseleave', () => {
                        const tooltip = document.getElementById('heatmap-tooltip');
                        if (tooltip)
                            tooltip.remove();
                    });
                    cell.addEventListener('mousemove', (e) => {
                        const t = document.getElementById('heatmap-tooltip');
                        if (t)
                            updateTooltipPosition(t, e.clientX, e.clientY);
                    });
                });
            }
        }
        catch (error) {
            console.error("Error loading study heatmap:", error);
        }
    });
}
/**
 * ==========================================
 * Helper Functions
 * ==========================================
 */
/**
 * Update tooltip position near cursor
 */
function updateTooltipPosition(tooltip, mouseX, mouseY) {
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
 * Load weekly objectives statistics
 */
function loadWeeklyObjectivesStats() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            console.log('Loading weekly objectives stats...');
            const stats = yield apiGet("/weekly-objectives/stats/");
            console.log('Weekly objectives stats loaded:', stats);
            // Update summary cards
            const totalEl = document.getElementById('weekly-objectives-total');
            const completedEl = document.getElementById('weekly-objectives-completed');
            const rateEl = document.getElementById('weekly-objectives-rate');
            if (totalEl)
                totalEl.textContent = stats.total_objectives.toString();
            if (completedEl)
                completedEl.textContent = stats.completed_objectives.toString();
            if (rateEl)
                rateEl.textContent = `${stats.completion_rate}%`;
            // Update weekly history
            const historyEl = document.getElementById('weekly-objectives-history');
            if (historyEl) {
                if (stats.weekly_stats.length === 0) {
                    historyEl.innerHTML = `
                    <div class="text-center text-gray-500 text-sm py-4">
                        No hay datos de objetivos semanales aún
                    </div>
                `;
                }
                else {
                    historyEl.innerHTML = stats.weekly_stats.map(week => `
                    <div class="flex justify-between items-center bg-dark-input rounded-lg p-3">
                        <div class="text-sm text-gray-300">
                            ${formatDate(week.week_start)} - ${formatDate(week.week_end)}
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs text-gray-400">${week.completed}/${week.total}</span>
                            <div class="w-16 bg-gray-700 rounded-full h-2">
                                <div class="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                     style="width: ${week.completion_rate}%"></div>
                            </div>
                            <span class="text-xs font-medium text-purple-400">${week.completion_rate.toFixed(0)}%</span>
                        </div>
                    </div>
                `).join('');
                }
            }
        }
        catch (error) {
            console.error("Error loading weekly objectives stats:", error);
            const historyEl = document.getElementById('weekly-objectives-history');
            if (historyEl) {
                historyEl.innerHTML = `
                <div class="text-center text-gray-500 text-sm py-4">
                    Error al cargar estadísticas: ${error}
                </div>
            `;
            }
        }
    });
}
/**
 * ==========================================
 * Scheduler for Weekly Stats
 * ==========================================
 */
function scheduleWeeklyStats(userTimezone) {
    const now = new Date();
    const userNow = new Date(now.toLocaleString("en-US", { timeZone: userTimezone }));
    // Próxima medianoche del usuario
    const nextMidnight = new Date(userNow);
    nextMidnight.setHours(24, 0, 0, 0);
    const delay = nextMidnight.getTime() - userNow.getTime();
    console.log(`Scheduling weekly stats in ${delay} ms`);
    setTimeout(() => {
        loadWeeklyObjectivesStats();
        // Repetir cada 7 días
        setInterval(loadWeeklyObjectivesStats, 7 * 24 * 60 * 60 * 1000);
    }, delay);
}
/**
 * ==========================================
 * Initialize
 * ==========================================
 */
(function initWeeklyStats() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const currentUser = yield getCurrentUser();
            const userTimezone = (_a = currentUser.timezone) !== null && _a !== void 0 ? _a : 'UTC';
            // Programamos scheduler semanal
            scheduleWeeklyStats(userTimezone);
            // Carga inicial de stats
            yield loadWeeklyObjectivesStats();
        }
        catch (error) {
            console.error("Error initializing weekly stats:", error);
            yield loadWeeklyObjectivesStats(); // al menos cargamos stats aunque falle el usuario
        }
    });
})();
/**
 * Load all progress data
 */
function loadProgress() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield Promise.all([
                loadMonthlyRhythm(),
                loadWeeklyConsistency(),
                loadMonthlyFocusDistribution(),
                loadStudyHeatmap(),
                loadWeeklyObjectivesStats()
            ]);
        }
        catch (error) {
            console.error("Error loading progress:", error);
        }
    });
}
/**
 * Initialize progress page when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProgress);
}
else {
    loadProgress();
}
