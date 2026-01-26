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
import { apiGet } from "./api.js";
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
        try {
            const sessions = yield apiGet("/pomodoro/");
            const trans = t();
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
            const monthlyHours = {};
            // Obtener el idioma actual una sola vez
            const currentLang = getCurrentLanguage();
            recentSessions.forEach(session => {
                const sessionDate = new Date(session.start_time);
                const monthKey = `${sessionDate.getFullYear()}-${String(sessionDate.getMonth() + 1).padStart(2, '0')}`;
                if (!monthlyHours[monthKey]) {
                    monthlyHours[monthKey] = 0;
                }
                monthlyHours[monthKey] += session.duration / 60; // Convert minutes to hours
            });
            // Sort months chronologically
            const sortedMonths = Object.keys(monthlyHours).sort();
            const monthLabels = [];
            const monthValues = [];
            sortedMonths.forEach(monthKey => {
                const [year, month] = monthKey.split('-');
                // Creamos una fecha dummy con el año y mes del key para formatearla
                const dateObj = new Date(parseInt(year), parseInt(month) - 1, 1);
                // Usamos toLocaleDateString para obtener el mes corto (ej: "Ene", "Jan", "Janv")
                const localizedMonth = dateObj.toLocaleDateString(currentLang, { month: 'short' });
                // Capitalizamos la primera letra por estética (opcional, útil en español)
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
/**
 * Load and render weekly consistency percentage
 */
function loadWeeklyConsistency() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sessions = yield apiGet("/pomodoro/");
            // Get last 7 days
            const today = new Date();
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            weekAgo.setHours(0, 0, 0, 0);
            // Count days with at least one session
            const daysWithStudy = new Set();
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
                const trans = translations[getCurrentLanguage()];
                const cardContent = consistencyCard.querySelector('.flex.flex-col');
                if (cardContent) {
                    cardContent.innerHTML = `
                    <div class="flex flex-col items-center justify-center h-full py-12">
                        <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                            <i data-lucide="target" class="w-8 h-8 text-purple-400"></i>
                        </div>
                        <h3 class="text-lg font-bold text-white mb-2">${trans.progress.weeklyConsistency}</h3>
                        <p class="text-gray-400 text-sm text-center max-w-xs">${trans.progress.consistencyDesc}</p>
                    </div>
                `;
                    if (typeof lucide !== 'undefined')
                        lucide.createIcons();
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
                const lang = getCurrentLanguage();
                const feedbackMap = {
                    es: ['¡Excelente constancia!', 'Muy buena constancia', 'Buen ritmo, sigue así', 'Puedes mejorar tu constancia', 'Intenta estudiar más días'],
                    en: ['Excellent consistency!', 'Very good consistency', 'Good pace, keep it up', 'You can improve your consistency', 'Try to study more days'],
                    zh: ['极佳的坚持！', '非常好的坚持', '节奏不错，继续保持', '可以提升坚持度', '尝试更多天学习'],
                    pt: ['Consistência excelente!', 'Muito boa consistência', 'Bom ritmo, continue assim', 'Você pode melhorar a constância', 'Tente estudar mais dias'],
                };
                const texts = feedbackMap[lang] || feedbackMap.es;
                let feedback = '';
                if (consistencyPercentage >= 85) {
                    feedback = texts[0];
                }
                else if (consistencyPercentage >= 70) {
                    feedback = texts[1];
                }
                else if (consistencyPercentage >= 50) {
                    feedback = texts[2];
                }
                else if (consistencyPercentage >= 30) {
                    feedback = texts[3];
                }
                else {
                    feedback = texts[4];
                }
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
 */
function loadMonthlyFocusDistribution() {
    return __awaiter(this, void 0, void 0, function* () {
        const trans = t();
        try {
            const sessions = yield apiGet("/pomodoro/");
            const subjects = yield apiGet("/subjects/");
            // Use current calendar month (dynamically computed) — updates automatically on day 1
            const today = new Date();
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
            // Filter sessions that belong to the same month/year as today (local timezone).
            // Defensive: validate date and ignore future sessions or non-positive durations.
            const monthlySessions = sessions.filter(s => {
                if (!s || !s.start_time || typeof s.duration !== 'number')
                    return false;
                const sessionDate = new Date(s.start_time);
                if (isNaN(sessionDate.getTime()))
                    return false;
                if (sessionDate > new Date())
                    return false; // ignore future
                return sessionDate.getFullYear() === today.getFullYear() && sessionDate.getMonth() === today.getMonth();
            });
            // Group minutes by subject
            const subjectMinutes = {};
            let totalMinutes = 0;
            monthlySessions.forEach(session => {
                let subjectId = null;
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
                    name: trans.dashboard.focusDistributionNoSubject,
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
            const donutChartParent = donutChart === null || donutChart === void 0 ? void 0 : donutChart.parentElement;
            if (donutChart && donutChartParent) {
                // Show empty state if no data
                if (monthlySessions.length === 0 || subjectData.length === 0) {
                    const trans = translations[getCurrentLanguage()];
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
                // Apply conic gradient to donut chart
                donutChart.style.background = `conic-gradient(${conicGradient.slice(0, -2)})`;
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
/**
 * Load and render study heatmap (GitHub-style: last year or 3 months)
 */
function loadStudyHeatmap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sessions = yield apiGet("/pomodoro/");
            // Get last year of data (or 3 months if preferred)
            const today = new Date();
            today.setHours(23, 59, 59, 999);
            const startDate = new Date(today);
            startDate.setFullYear(startDate.getFullYear() - 1);
            startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday of that week
            // Group sessions by date
            const dailyHours = {};
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
            if (!heatmapContainer || !heatmapGrid)
                return;
            // Show empty state if no data
            if (Object.keys(dailyHours).length === 0 || sessions.length === 0) {
                const trans = translations[getCurrentLanguage()];
                heatmapContainer.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 w-full">
                    <div class="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500/20 via-fuchsia-500/20 to-purple-500/20 flex items-center justify-center mb-4" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                        <i data-lucide="calendar" class="w-8 h-8 text-purple-400"></i>
                    </div>
                    <h3 class="text-lg font-bold text-white mb-2">${trans.progress.heatmap}</h3>
                    <p class="text-gray-400 text-sm text-center max-w-xs">${trans.progress.heatmapDesc}</p>
                </div>
            `;
                if (typeof lucide !== 'undefined')
                    lucide.createIcons();
                return;
            }
            // Update total contributions
            if (heatmapTotal) {
                const totalHours = Object.values(dailyHours).reduce((sum, hours) => sum + hours, 0);
                const lang = getCurrentLanguage();
                const suffixMap = {
                    es: 'días con estudio en el último año',
                    en: 'days with study in the last year',
                    zh: '天在过去一年有学习记录',
                    pt: 'dias com estudo no último ano',
                };
                heatmapTotal.textContent = `${totalContributions} ${suffixMap[lang] || ''}`;
            }
            // Organize by weeks (Sunday to Saturday)
            const weeks = [];
            const currentDate = new Date(startDate);
            while (currentDate <= today) {
                const week = [];
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
            const monthLabels = [];
            const seenMonths = new Set();
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
            const lang = getCurrentLanguage();
            const dayLabels = lang === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                : lang === 'pt' ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                    : lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六']
                        : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            dayLabels.forEach((label, dayIndex) => {
                if (dayIndex % 2 === 0) { // Show only some days to save space
                    heatmapHTML += `<div class="heatmap-day-label" style="height: 11px; line-height: 11px; padding-top: 1px;">${label}</div>`;
                }
                else {
                    heatmapHTML += `<div class="heatmap-day-label" style="height: 11px;"></div>`;
                }
            });
            heatmapHTML += '</div>';
            // Weeks and months
            heatmapHTML += '<div class="flex gap-0.5 flex-1 min-w-0">';
            weeks.forEach((week, weekIndex) => {
                // Check if this week starts a new month
                const monthLabel = monthLabels.find(m => m.weekIndex === weekIndex);
                let monthName = '';
                if (monthLabel) {
                    const dateObj = new Date(new Date().getFullYear(), monthLabel.month, 1);
                    const shortMonth = dateObj.toLocaleDateString(getCurrentLanguage(), { month: 'short' });
                    monthName = shortMonth.charAt(0).toUpperCase() + shortMonth.slice(1); // Ene, Feb...
                }
                heatmapHTML += '<div class="flex flex-col flex-shrink-0">';
                // Month label
                if (monthLabel) {
                    heatmapHTML += `<div class="heatmap-month-label">${monthName}</div>`;
                }
                else {
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
                cell.addEventListener('mouseenter', (e) => {
                    const mouseEvent = e;
                    const tooltip = document.createElement('div');
                    tooltip.id = 'heatmap-tooltip';
                    tooltip.className = 'fixed bg-dark-card border border-purple-500/30 rounded-lg px-3 py-2 text-sm text-white shadow-lg z-50 pointer-events-none';
                    const date = cell.getAttribute('data-date');
                    const hours = cell.getAttribute('data-hours');
                    if (date) {
                        const dateObj = new Date(date);
                        const lang = getCurrentLanguage();
                        const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang === 'zh' ? 'zh-CN' : 'es-AR';
                        const dateStr = dateObj.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
                        const hoursNum = parseFloat(hours || '0');
                        const noStudyMap = {
                            es: 'Sin estudio',
                            en: 'No study',
                            zh: '无学习',
                            pt: 'Sem estudo',
                        };
                        const studiedSuffixMap = {
                            es: 'h estudiadas',
                            en: 'h studied',
                            zh: '小时学习',
                            pt: 'h estudadas',
                        };
                        const titleText = hoursNum > 0
                            ? `${hoursNum.toFixed(1)}${studiedSuffixMap[lang] || studiedSuffixMap.es}`
                            : noStudyMap[lang] || noStudyMap.es;
                        tooltip.innerHTML = `
                        <div class="font-bold text-purple-400">${titleText}</div>
                        <div class="text-gray-300">${dateStr}</div>
                    `;
                    }
                    document.body.appendChild(tooltip);
                    updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                });
                cell.addEventListener('mouseleave', () => {
                    const tooltip = document.getElementById('heatmap-tooltip');
                    if (tooltip)
                        tooltip.remove();
                });
                cell.addEventListener('mousemove', (e) => {
                    const mouseEvent = e;
                    const tooltip = document.getElementById('heatmap-tooltip');
                    if (tooltip) {
                        updateTooltipPosition(tooltip, mouseEvent.clientX, mouseEvent.clientY);
                    }
                });
            });
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
 * Load all progress data
 */
function loadProgress() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('Loading progress data...');
        try {
            yield Promise.all([
                loadMonthlyRhythm(),
                loadWeeklyConsistency(),
                loadMonthlyFocusDistribution(),
                loadStudyHeatmap(),
                loadWeeklyObjectivesStats()
            ]);
            console.log('Progress data loaded successfully');
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
