var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Import API functions and types
import { getEvents, createEvent, updateEvent, deleteEvent, completeEvent, apiGet } from "./api.js";
import { initConfirmModal, showConfirmModal, showAlertModal } from "./confirmModal.js";
import { translations, getCurrentLanguage } from "./i18n.js";
// Global state
let events = [];
let subjects = [];
let currentDate = new Date();
let currentEditingEvent = null;
let selectedDate = null;
let currentView = 'calendar';
const completingEventIds = new Set();
/**
 * Initialize the planner page
 */
function initPlanner() {
    return __awaiter(this, void 0, void 0, function* () {
        initConfirmModal();
        yield loadEvents();
        yield loadSubjects();
        setupEventListeners();
        renderAll();
        if (typeof lucide !== 'undefined')
            lucide.createIcons();
    });
}
/**
 * Load events from API
 */
function loadEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            events = (yield getEvents()).map((event) => normalizeEventStatus(event));
            syncLocalMissedStatuses();
        }
        catch (error) {
            console.error('Error loading events:', error);
        }
    });
}
function renderAll() {
    syncLocalMissedStatuses();
    renderCalendar();
    renderDailyProgress();
    renderCurrentView();
}
function normalizeEventStatus(event) {
    if (event.status === 'pending' || event.status === 'completed' || event.status === 'missed') {
        return event;
    }
    return Object.assign(Object.assign({}, event), { status: 'pending' });
}
function getEventStatus(event) {
    if (event.status === 'pending' || event.status === 'completed' || event.status === 'missed') {
        return event.status;
    }
    return 'pending';
}
function canUncheckCompletedToday(event) {
    return getEventStatus(event) === 'completed' && event.date === formatDateForInput(new Date());
}
function syncLocalMissedStatuses() {
    const today = formatDateForInput(new Date());
    events = events.map((event) => {
        if (getEventStatus(event) !== 'pending')
            return event;
        if (event.date < today) {
            return Object.assign(Object.assign({}, event), { status: 'missed' });
        }
        return event;
    });
}
function renderCurrentView() {
    const calendarView = document.getElementById('calendarView');
    const todayView = document.getElementById('todayView');
    if (!calendarView || !todayView)
        return;
    const isCalendar = currentView === 'calendar';
    calendarView.classList.toggle('hidden', !isCalendar);
    todayView.classList.toggle('hidden', isCalendar);
    updateViewToggleState();
    if (isCalendar) {
        renderWeeklySchedule();
    }
    else {
        renderTodayList();
    }
}
function updateViewToggleState() {
    const calendarBtn = document.getElementById('viewCalendarBtn');
    const todayBtn = document.getElementById('viewTodayBtn');
    if (!calendarBtn || !todayBtn)
        return;
    calendarBtn.className = `planner-view-btn px-3 py-2 text-sm rounded-lg transition-all ${currentView === 'calendar'
        ? 'bg-purple-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.35)]'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`;
    todayBtn.className = `planner-view-btn px-3 py-2 text-sm rounded-lg transition-all ${currentView === 'today'
        ? 'bg-purple-600 text-white shadow-[0_0_18px_rgba(168,85,247,0.35)]'
        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`;
}
function renderDailyProgress() {
    const progressBar = document.getElementById('dailyProgressBar');
    const progressPercent = document.getElementById('dailyProgressPercent');
    const progressLabel = document.getElementById('dailyProgressLabel');
    if (!progressBar || !progressPercent || !progressLabel)
        return;
    const today = formatDateForInput(new Date());
    const todayEvents = events.filter((event) => event.date === today);
    const total = todayEvents.length;
    const completed = todayEvents.filter((event) => getEventStatus(event) === 'completed').length;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressLabel.textContent = total > 0 ? `${completed}/${total} completados hoy` : 'Sin eventos para hoy';
}
/**
 * Load subjects from API for the dropdown
 */
function loadSubjects() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            subjects = yield apiGet("/subjects/");
            updateSubjectDropdown();
        }
        catch (error) {
            console.error('Error loading subjects:', error);
        }
    });
}
/**
 * Update the subject dropdown in the modal
 */
function updateSubjectDropdown() {
    const subjectSelect = document.getElementById('eventSubject');
    if (!subjectSelect)
        return;
    // Clear existing options except the first one
    while (subjectSelect.options.length > 1) {
        subjectSelect.remove(1);
    }
    // Add subjects to dropdown
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id.toString();
        option.textContent = subject.name;
        subjectSelect.appendChild(option);
    });
}
/**
 * Render the monthly calendar (compact, for navigation only)
 */
function renderCalendar() {
    const lang = getCurrentLanguage();
    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang === 'zh' ? 'zh-CN' : 'es-AR';
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    if (!calendarGrid || !currentMonthYear)
        return;
    // Update month/year display
    currentMonthYear.textContent = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(currentDate);
    // Get first day of month and number of days
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Monday = 0
    // Get Monday of current week for highlighting
    const monday = getMondayOfWeek(currentDate);
    // Clear grid
    calendarGrid.innerHTML = '';
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'h-8';
        calendarGrid.appendChild(emptyCell);
    }
    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayCell = document.createElement('div');
        const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const isInCurrentWeek = isDateInWeek(dayDate, monday);
        const dayEvents = getEventsForDate(dayDate);
        const hasEvents = dayEvents.length > 0;
        const hasCompleted = dayEvents.some((event) => getEventStatus(event) === 'completed');
        const hasMissed = dayEvents.some((event) => getEventStatus(event) === 'missed');
        dayCell.className = `calendar-day h-8 border border-gray-800 rounded flex items-center justify-center cursor-pointer transition-all relative ${isToday(dayDate) ? 'bg-purple-500/20 border-purple-500/50' : ''} ${isInCurrentWeek ? 'ring-2 ring-purple-500/50' : ''} hover:border-purple-500/50 hover:bg-purple-500/10`;
        dayCell.innerHTML = `
            <span class="text-xs font-medium ${isToday(dayDate) ? 'text-purple-400' : isInCurrentWeek ? 'text-white font-bold' : 'text-gray-300'}">${day}</span>
            ${hasEvents ? '<span class="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400"></span>' : ''}
            ${hasCompleted ? '<span class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>' : ''}
            ${hasMissed ? '<span class="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-red-400/80"></span>' : ''}
        `;
        // Click handler to navigate to that week
        dayCell.addEventListener('click', () => {
            currentDate = new Date(dayDate);
            currentView = 'calendar';
            renderAll();
        });
        calendarGrid.appendChild(dayCell);
    }
    // Add empty cells for days after month ends (to fill the grid)
    const totalCells = startingDayOfWeek + daysInMonth;
    const remainingCells = 42 - totalCells; // 6 rows * 7 days
    for (let i = 0; i < remainingCells && i < 7; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.className = 'h-8';
        calendarGrid.appendChild(emptyCell);
    }
    // Re-initialize icons
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
}
/**
 * Check if a date is in the given week (starting from Monday)
 */
function isDateInWeek(date, weekStart) {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    const weekStartOnly = new Date(weekStart);
    weekStartOnly.setHours(0, 0, 0, 0);
    return dateOnly >= weekStartOnly && dateOnly <= weekEnd;
}
/**
 * Render the weekly schedule (main area for events)
 */
function renderWeeklySchedule() {
    const lang = getCurrentLanguage();
    const trans = translations[lang];
    const locale = lang === 'en' ? 'en-US' : lang === 'pt' ? 'pt-BR' : lang === 'zh' ? 'zh-CN' : 'es-AR';
    const weeklySchedule = document.getElementById('weeklySchedule');
    const weekRange = document.getElementById('weekRange');
    const weekNumber = document.getElementById('weekNumber');
    if (!weeklySchedule || !weekRange)
        return;
    // Get Monday of current week
    const monday = getMondayOfWeek(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    // Update week range display
    weekRange.textContent = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(monday);
    // Calculate week number
    if (weekNumber) {
        const weekNum = getWeekNumber(monday);
        weekNumber.textContent = (trans.planner.weekNumberLabel || 'Semana {n}').replace('{n}', String(weekNum));
    }
    // Update day headers with dates
    for (let i = 0; i < 7; i++) {
        const date = new Date(monday);
        date.setDate(monday.getDate() + i);
        const dayElement = document.getElementById(`day-${i}-date`);
        if (dayElement) {
            dayElement.textContent = date.getDate().toString();
            if (isToday(date)) {
                dayElement.classList.add('text-purple-400');
            }
            else {
                dayElement.classList.remove('text-purple-400');
            }
        }
    }
    // Clear schedule
    weeklySchedule.innerHTML = '';
    const timeLabelColumnWidth = window.innerWidth < 768 ? 44 : 52;
    const gridTemplate = `${timeLabelColumnWidth}px repeat(7, minmax(0, 1fr))`;
    const weeklyScheduleHeader = document.getElementById('weeklyScheduleHeader');
    if (weeklyScheduleHeader) {
        weeklyScheduleHeader.style.gridTemplateColumns = gridTemplate;
    }
    // Create time slots (00:00 to 23:00)
    for (let hour = 0; hour < 24; hour++) {
        const timeRow = document.createElement('div');
        timeRow.className = 'grid gap-2';
        timeRow.style.gridTemplateColumns = gridTemplate;
        // Time label (first column) - fixed width
        const timeLabel = document.createElement('div');
        timeLabel.className = 'text-xs text-gray-500 text-right pr-2 flex items-center justify-end h-12 whitespace-nowrap tabular-nums';
        timeLabel.textContent = `${String(hour).padStart(2, '0')}:00`;
        timeRow.appendChild(timeLabel);
        // Day columns (7 columns for days)
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + day);
            dayDate.setHours(hour, 0, 0, 0);
            const cell = document.createElement('div');
            cell.className = 'h-12 border border-gray-800 rounded relative hover:border-purple-500/50 cursor-pointer group bg-dark-card overflow-visible';
            cell.dataset.date = formatDateForInput(dayDate);
            cell.dataset.hour = hour.toString();
            // Check for events that overlap with this hour
            const dayEvents = getEventsForDate(dayDate);
            const overlappingEvents = dayEvents.filter(event => {
                const eventStartHour = parseInt(event.start_time.split(':')[0]);
                const eventStartMin = parseInt(event.start_time.split(':')[1]);
                const eventEndHour = parseInt(event.end_time.split(':')[0]);
                const eventEndMin = parseInt(event.end_time.split(':')[1]);
                const eventStartMinutes = eventStartHour * 60 + eventStartMin;
                const eventEndMinutes = eventEndHour * 60 + eventEndMin;
                const hourStartMinutes = hour * 60;
                const hourEndMinutes = (hour + 1) * 60;
                // Event overlaps if it starts before this hour ends and ends after this hour starts
                return eventStartMinutes < hourEndMinutes && eventEndMinutes > hourStartMinutes;
            });
            if (overlappingEvents.length > 0) {
                // Show events that overlap with this hour
                overlappingEvents.forEach(event => {
                    var _a;
                    const eventStartHour = parseInt(event.start_time.split(':')[0]);
                    const eventStartMin = parseInt(event.start_time.split(':')[1]);
                    const eventEndHour = parseInt(event.end_time.split(':')[0]);
                    const eventEndMin = parseInt(event.end_time.split(':')[1]);
                    const eventStartMinutes = eventStartHour * 60 + eventStartMin;
                    const eventEndMinutes = eventEndHour * 60 + eventEndMin;
                    const hourStartMinutes = hour * 60;
                    const hourEndMinutes = (hour + 1) * 60;
                    // Calculate if this is the first hour of the event
                    const isFirstHour = eventStartHour === hour;
                    // Calculate if this is the last hour of the event
                    const isLastHour = eventEndHour === hour || (eventEndHour === hour + 1 && eventEndMin === 0);
                    // Calculate height and position for this specific hour
                    let topOffset = 0;
                    let height = 48; // Full hour by default (h-12 = 48px)
                    if (isFirstHour && isLastHour) {
                        // Event starts and ends in the same hour
                        topOffset = (eventStartMin / 60) * 48;
                        height = ((eventEndMinutes - eventStartMinutes) / 60) * 48;
                    }
                    else if (isFirstHour) {
                        // Event starts in this hour but continues
                        topOffset = (eventStartMin / 60) * 48;
                        height = 48 - topOffset; // Fill from start to end of hour
                    }
                    else if (isLastHour) {
                        // Event ends in this hour but started earlier
                        topOffset = 0;
                        height = (eventEndMin / 60) * 48;
                    }
                    else {
                        // Event spans the full hour (middle hours) - fill entire cell
                        topOffset = 0;
                        height = 48;
                    }
                    // Ensure minimum height
                    height = Math.max(height, 24);
                    const status = getEventStatus(event);
                    const isCompleted = status === 'completed';
                    const isMissed = status === 'missed';
                    const isPending = status === 'pending';
                    const isCompleting = Boolean(event.id && completingEventIds.has(event.id));
                    const eventDiv = document.createElement('div');
                    eventDiv.className = `event-item ${getEventTypeClass(event.type)} ${status} text-xs rounded absolute left-0 right-0 z-10 cursor-pointer overflow-hidden`;
                    eventDiv.style.height = `${height}px`;
                    eventDiv.style.top = `${topOffset}px`;
                    eventDiv.style.minHeight = `${height}px`;
                    eventDiv.title = `${event.title} - ${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`;
                    eventDiv.dataset.eventId = ((_a = event.id) === null || _a === void 0 ? void 0 : _a.toString()) || '';
                    const checkbox = document.createElement('button');
                    checkbox.type = 'button';
                    checkbox.className = `event-status-checkbox ${window.innerWidth < 768 ? 'always-visible' : 'show-on-hover'}`;
                    const canToggle = isPending || canUncheckCompletedToday(event);
                    checkbox.setAttribute('aria-label', `${isCompleted ? 'Desmarcar' : 'Completar'} ${event.title}`);
                    checkbox.disabled = !canToggle || isMissed || isCompleting || !event.id;
                    checkbox.innerHTML = isCompleted
                        ? '<i data-lucide="check" class="w-3 h-3 text-emerald-200"></i>'
                        : '<span class="event-checkbox-dot"></span>';
                    if (isCompleted)
                        checkbox.classList.add('is-completed');
                    if (checkbox.disabled)
                        checkbox.classList.add('is-disabled');
                    checkbox.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!event.id || checkbox.disabled)
                            return;
                        yield markEventAsCompletedOptimistic(event.id);
                    }));
                    const content = document.createElement('div');
                    content.className = 'event-content h-full w-full flex items-center gap-1 px-1.5';
                    const titleSpan = document.createElement('span');
                    titleSpan.className = `event-title-text block truncate ${isCompleted ? 'line-through text-gray-300/80' : 'text-gray-100'}`;
                    titleSpan.textContent = event.title;
                    content.appendChild(titleSpan);
                    if (isCompleted) {
                        const completedIcon = document.createElement('i');
                        completedIcon.setAttribute('data-lucide', 'check-check');
                        completedIcon.className = 'w-3 h-3 text-emerald-300 flex-shrink-0';
                        content.appendChild(completedIcon);
                    }
                    eventDiv.appendChild(checkbox);
                    eventDiv.appendChild(content);
                    eventDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (event.id)
                            editEvent(event.id);
                    });
                    cell.appendChild(eventDiv);
                });
            }
            else {
                // Show plus icon on hover only if cell is truly empty
                const plusIcon = document.createElement('div');
                plusIcon.className = 'add-event-btn absolute inset-0 flex items-center justify-center text-gray-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all';
                plusIcon.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i>';
                cell.appendChild(plusIcon);
            }
            cell.addEventListener('click', (e) => {
                // Don't open modal if clicking on an event
                if (e.target.closest('.event-item'))
                    return;
                selectedDate = dayDate;
                openEventModal(dayDate, hour);
            });
            timeRow.appendChild(cell);
        }
        weeklySchedule.appendChild(timeRow);
    }
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
}
function renderTodayList() {
    const todayList = document.getElementById('todayList');
    if (!todayList)
        return;
    const todayDate = formatDateForInput(new Date());
    const todayEvents = events
        .filter((event) => event.date === todayDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time));
    todayList.innerHTML = '';
    if (todayEvents.length === 0) {
        todayList.innerHTML = `
            <div class="today-empty text-center text-sm text-gray-400 py-10 border border-dashed border-gray-700 rounded-xl">
                No hay eventos para hoy.
            </div>
        `;
        return;
    }
    todayEvents.forEach((event) => {
        const status = getEventStatus(event);
        const isCompleted = status === 'completed';
        const isMissed = status === 'missed';
        const isPending = status === 'pending';
        const isCompleting = Boolean(event.id && completingEventIds.has(event.id));
        const item = document.createElement('article');
        item.className = `today-item ${status} ${getEventTypeClass(event.type)} flex items-start gap-3 rounded-xl px-3 py-3 border border-gray-800 bg-[#141821] transition-all`;
        const checkbox = document.createElement('button');
        checkbox.type = 'button';
        checkbox.className = 'event-status-checkbox always-visible list-mode';
        const canToggle = isPending || canUncheckCompletedToday(event);
        checkbox.disabled = !canToggle || isMissed || isCompleting || !event.id;
        checkbox.setAttribute('aria-label', `${isCompleted ? 'Desmarcar' : 'Completar'} ${event.title}`);
        checkbox.innerHTML = isCompleted
            ? '<i data-lucide="check" class="w-3 h-3 text-emerald-200"></i>'
            : '<span class="event-checkbox-dot"></span>';
        if (isCompleted)
            checkbox.classList.add('is-completed');
        if (checkbox.disabled)
            checkbox.classList.add('is-disabled');
        checkbox.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            e.stopPropagation();
            if (!event.id || checkbox.disabled)
                return;
            yield markEventAsCompletedOptimistic(event.id);
        }));
        const content = document.createElement('div');
        content.className = 'min-w-0 flex-1';
        content.innerHTML = `
            <div class="flex items-center gap-2 min-w-0">
                <h3 class="today-title text-sm font-medium truncate ${isCompleted ? 'line-through text-gray-400' : 'text-white'}">${event.title}</h3>
                ${isCompleted ? '<i data-lucide="check-check" class="w-3.5 h-3.5 text-emerald-400 inline-block ml-1"></i>' : ''}
                ${isMissed ? '<span class="text-xs text-red-300">Vencido</span>' : ''}
            </div>
            <p class="text-xs text-gray-400 mt-1 truncate">${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}</p>
        `;
        item.appendChild(checkbox);
        item.appendChild(content);
        todayList.appendChild(item);
    });
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
}
function markEventAsCompletedOptimistic(eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentEvent = events.find((event) => event.id === eventId);
        if (!currentEvent)
            return;
        const statusBefore = getEventStatus(currentEvent);
        const canToggleToPending = statusBefore === 'completed' && canUncheckCompletedToday(currentEvent);
        if (!(statusBefore === 'pending' || canToggleToPending) || completingEventIds.has(eventId))
            return;
        const nextStatus = statusBefore === 'pending' ? 'completed' : 'pending';
        completingEventIds.add(eventId);
        events = events.map((event) => (event.id === eventId ? Object.assign(Object.assign({}, event), { status: nextStatus }) : event));
        renderAll();
        try {
            const updated = normalizeEventStatus(yield completeEvent(eventId));
            events = events.map((event) => (event.id === eventId ? updated : event));
        }
        catch (error) {
            events = events.map((event) => (event.id === eventId ? Object.assign(Object.assign({}, event), { status: statusBefore }) : event));
            yield loadEvents();
            const trans = translations[getCurrentLanguage()];
            yield showAlertModal('No se pudo actualizar el estado del evento.', trans.common.error);
        }
        finally {
            completingEventIds.delete(eventId);
            renderAll();
        }
    });
}
/**
 * Get events for a specific date
 */
function getEventsForDate(date) {
    const dateStr = formatDateForInput(date);
    return events.filter(event => event.date === dateStr);
}
/**
 * Get events for a specific date and hour (deprecated - use getEventsForDate instead)
 */
function getEventsForDateAndHour(date, hour) {
    const dateStr = formatDateForInput(date);
    return events.filter(event => {
        if (event.date !== dateStr)
            return false;
        const startHour = parseInt(event.start_time.split(':')[0]);
        return startHour === hour;
    });
}
/**
 * Get CSS class for event type
 */
function getEventTypeClass(type) {
    switch (type) {
        case 1: return ''; // Study Block - default purple
        case 2: return 'exam'; // Exam - red
        case 3: return 'task'; // Important Task - yellow
        case 4: return 'personal'; // Personal - green
        default: return '';
    }
}
/**
 * Check if date is today
 */
function isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}
/**
 * Get Monday of the week for a given date
 */
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}
/**
 * Get week number of the year
 */
function getWeekNumber(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}
/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Format time for input field (HH:MM)
 */
function formatTimeForInput(time) {
    return time.substring(0, 5); // Extract HH:MM from HH:MM:SS
}
/**
 * Open event modal
 */
function openEventModal(date, hour) {
    const modal = document.getElementById('eventModal');
    const form = document.getElementById('eventForm');
    const modalTitle = document.getElementById('modalTitle');
    const lang = getCurrentLanguage();
    const plannerTrans = translations[lang].planner;
    if (!modal || !form)
        return;
    // Reset form
    form.reset();
    currentEditingEvent = null;
    // Update subject dropdown
    updateSubjectDropdown();
    // Set default values
    const eventDate = date || selectedDate || new Date();
    const eventDateInput = document.getElementById('eventDate');
    const eventStartTime = document.getElementById('eventStartTime');
    const eventEndTime = document.getElementById('eventEndTime');
    if (eventDateInput) {
        eventDateInput.value = formatDateForInput(eventDate);
    }
    if (eventStartTime && hour !== undefined) {
        eventStartTime.value = `${String(hour).padStart(2, '0')}:00`;
    }
    else if (eventStartTime) {
        eventStartTime.value = '00:00';
    }
    if (eventEndTime && hour !== undefined) {
        eventEndTime.value = `${String(hour + 1).padStart(2, '0')}:00`;
    }
    else if (eventEndTime) {
        eventEndTime.value = '01:00';
    }
    if (modalTitle) {
        modalTitle.textContent = plannerTrans.newEvent;
    }
    // Hide delete button for new events
    const deleteBtn = document.getElementById('deleteEventBtn');
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    modal.style.display = 'flex';
    document.body.classList.add('has-open-modal');
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        // Remove shadows from all icons in modal after they're created
        const removeShadows = () => {
            const modalIcons = modal.querySelectorAll('[data-lucide]');
            modalIcons.forEach(icon => {
                const iconEl = icon;
                iconEl.style.filter = 'none';
                iconEl.style.textShadow = 'none';
                iconEl.style.boxShadow = 'none';
                iconEl.style.webkitFilter = 'none';
                const svg = icon.querySelector('svg');
                if (svg) {
                    svg.style.filter = 'none';
                    svg.style.textShadow = 'none';
                    svg.style.boxShadow = 'none';
                    svg.style.webkitFilter = 'none';
                    // Remove from all paths inside SVG
                    const paths = svg.querySelectorAll('path');
                    paths.forEach(path => {
                        const pathEl = path;
                        if (pathEl.style) {
                            pathEl.style.filter = 'none';
                            pathEl.style.webkitFilter = 'none';
                        }
                    });
                }
            });
        };
        // Try multiple times to catch icons that are created asynchronously
        removeShadows();
        setTimeout(removeShadows, 50);
        setTimeout(removeShadows, 100);
        setTimeout(removeShadows, 200);
    }
}
/**
 * Close event modal
 */
function closeEventModal() {
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.classList.remove('has-open-modal');
        const form = document.getElementById('eventForm');
        if (form)
            form.reset();
        currentEditingEvent = null;
        // Hide delete button
        const deleteBtn = document.getElementById('deleteEventBtn');
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }
}
/**
 * Edit event
 */
function editEvent(eventId) {
    var _a;
    const event = events.find(e => e.id === eventId);
    if (!event)
        return;
    currentEditingEvent = event;
    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('eventForm');
    const plannerTrans = translations[getCurrentLanguage()].planner;
    if (!modal || !form || !modalTitle)
        return;
    // Populate form
    document.getElementById('eventTitle').value = event.title;
    document.getElementById('eventDate').value = event.date;
    document.getElementById('eventType').value = event.type.toString();
    document.getElementById('eventStartTime').value = formatTimeForInput(event.start_time);
    document.getElementById('eventEndTime').value = formatTimeForInput(event.end_time);
    document.getElementById('eventSubject').value = ((_a = event.subject) === null || _a === void 0 ? void 0 : _a.toString()) || '';
    document.getElementById('eventNotes').value = event.notes || '';
    modalTitle.textContent = plannerTrans.editEvent;
    // Show delete button for existing events
    const deleteBtn = document.getElementById('deleteEventBtn');
    if (deleteBtn) {
        deleteBtn.style.display = 'block';
    }
    modal.style.display = 'flex';
    document.body.classList.add('has-open-modal');
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        // Remove shadows from all icons in modal after they're created
        const removeShadows = () => {
            const modalIcons = modal.querySelectorAll('[data-lucide]');
            modalIcons.forEach(icon => {
                const iconEl = icon;
                iconEl.style.filter = 'none';
                iconEl.style.textShadow = 'none';
                iconEl.style.boxShadow = 'none';
                iconEl.style.webkitFilter = 'none';
                const svg = icon.querySelector('svg');
                if (svg) {
                    svg.style.filter = 'none';
                    svg.style.textShadow = 'none';
                    svg.style.boxShadow = 'none';
                    svg.style.webkitFilter = 'none';
                    // Remove from all paths inside SVG
                    const paths = svg.querySelectorAll('path');
                    paths.forEach(path => {
                        const pathEl = path;
                        if (pathEl.style) {
                            pathEl.style.filter = 'none';
                            pathEl.style.webkitFilter = 'none';
                        }
                    });
                }
            });
        };
        // Try multiple times to catch icons that are created asynchronously
        removeShadows();
        setTimeout(removeShadows, 50);
        setTimeout(removeShadows, 100);
        setTimeout(removeShadows, 200);
    }
}
/**
 * Setup all event listeners
 */
function setupEventListeners() {
    // Month navigation
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }
    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }
    // Week navigation
    const prevWeekBtn = document.getElementById('prevWeekBtn');
    const nextWeekBtn = document.getElementById('nextWeekBtn');
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() - 7);
            renderAll();
        });
    }
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 7);
            renderAll();
        });
    }
    const viewCalendarBtn = document.getElementById('viewCalendarBtn');
    const viewTodayBtn = document.getElementById('viewTodayBtn');
    if (viewCalendarBtn) {
        viewCalendarBtn.addEventListener('click', () => {
            currentView = 'calendar';
            renderAll();
        });
    }
    if (viewTodayBtn) {
        viewTodayBtn.addEventListener('click', () => {
            currentView = 'today';
            renderAll();
        });
    }
    // Add event button
    const addEventBtn = document.getElementById('addEventBtn');
    if (addEventBtn) {
        addEventBtn.addEventListener('click', () => {
            // Open modal with current week's Monday
            const monday = getMondayOfWeek(currentDate);
            openEventModal(monday);
        });
    }
    // Modal controls
    const closeEventModalBtn = document.getElementById('closeEventModalBtn');
    const cancelEventBtn = document.getElementById('cancelEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    if (closeEventModalBtn) {
        closeEventModalBtn.addEventListener('click', closeEventModal);
    }
    if (cancelEventBtn) {
        cancelEventBtn.addEventListener('click', closeEventModal);
    }
    if (deleteEventBtn) {
        deleteEventBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
            if (currentEditingEvent && currentEditingEvent.id) {
                const eventId = currentEditingEvent.id;
                const trans = translations[getCurrentLanguage()];
                // Close the event modal first so confirmation is never hidden behind it.
                closeEventModal();
                const confirmed = yield showConfirmModal(trans.confirmations.deleteEventMessage, trans.confirmations.deleteEventTitle);
                if (confirmed) {
                    yield deleteEventById(eventId);
                }
                else {
                    // Restore editing context when user cancels deletion.
                    editEvent(eventId);
                }
            }
        }));
    }
    // Form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
        eventForm.addEventListener('submit', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            yield saveEvent();
        }));
    }
    // Close modal on overlay click
    const modal = document.getElementById('eventModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeEventModal();
            }
        });
    }
    window.addEventListener('resize', () => {
        renderAll();
    });
}
/**
 * Delete event by ID
 */
function deleteEventById(eventId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield deleteEvent(eventId);
            closeEventModal();
            yield loadEvents();
            renderAll();
        }
        catch (error) {
            console.error('Error deleting event:', error);
            const trans = translations[getCurrentLanguage()];
            yield showAlertModal(trans.confirmations.deleteEventMessage, trans.common.error);
        }
    });
}
/**
 * Save event (create or update)
 */
function saveEvent() {
    return __awaiter(this, void 0, void 0, function* () {
        const form = document.getElementById('eventForm');
        if (!form)
            return;
        const trans = translations[getCurrentLanguage()];
        const formData = new FormData(form);
        const title = formData.get('title');
        const date = formData.get('date');
        const type = parseInt(formData.get('type'));
        const start_time = formData.get('start_time');
        const end_time = formData.get('end_time');
        const subject = formData.get('subject') || null;
        const notes = formData.get('notes') || null;
        try {
            const eventData = {
                title,
                date,
                type,
                start_time,
                end_time,
                subject: subject && subject !== '' ? parseInt(subject) : null,
                notes
            };
            if (currentEditingEvent && currentEditingEvent.id) {
                // Update existing event
                yield updateEvent(currentEditingEvent.id, eventData);
            }
            else {
                // Create new event
                yield createEvent(eventData);
            }
            closeEventModal();
            yield loadEvents();
            renderAll();
        }
        catch (error) {
            console.error('Error saving event:', error);
            yield showAlertModal(trans.common.error, trans.common.error);
        }
    });
}
// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPlanner);
