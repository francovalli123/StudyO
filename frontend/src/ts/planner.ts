// Import API functions and types
import { getEvents, createEvent, updateEvent, deleteEvent, Event, apiGet } from "./api.js";
import { Subject } from "./api.js";
import { initConfirmModal, showConfirmModal, showAlertModal } from "./confirmModal.js";

declare const lucide: {
    createIcons: () => void;
};

// Global state
let events: Event[] = [];
let subjects: Subject[] = [];
let currentDate = new Date();
let currentEditingEvent: Event | null = null;
let selectedDate: Date | null = null;

// Spanish month names
const monthNames = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const dayNamesShort = ['do', 'lu', 'ma', 'mi', 'ju', 'vi', 'sá'];

/**
 * Initialize the planner page
 */
async function initPlanner() {
    initConfirmModal();
    await loadEvents();
    await loadSubjects();
    renderCalendar();
    renderWeeklySchedule();
    setupEventListeners();
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Load events from API
 */
async function loadEvents() {
    try {
        events = await getEvents();
        renderCalendar();
        renderWeeklySchedule();
    } catch (error) {
        console.error('Error loading events:', error);
    }
}

/**
 * Load subjects from API for the dropdown
 */
async function loadSubjects() {
    try {
        subjects = await apiGet<Subject[]>("/subjects/");
        updateSubjectDropdown();
    } catch (error) {
        console.error('Error loading subjects:', error);
    }
}

/**
 * Update the subject dropdown in the modal
 */
function updateSubjectDropdown() {
    const subjectSelect = document.getElementById('eventSubject') as HTMLSelectElement;
    if (!subjectSelect) return;
    
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
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    
    if (!calendarGrid || !currentMonthYear) return;
    
    // Update month/year display
    currentMonthYear.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    
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
        
        dayCell.className = `calendar-day h-8 border border-gray-800 rounded flex items-center justify-center cursor-pointer transition-all relative ${
            isToday(dayDate) ? 'bg-purple-500/20 border-purple-500/50' : ''
        } ${
            isInCurrentWeek ? 'ring-2 ring-purple-500/50' : ''
        } hover:border-purple-500/50 hover:bg-purple-500/10`;
        
        dayCell.innerHTML = `
            <span class="text-xs font-medium ${isToday(dayDate) ? 'text-purple-400' : isInCurrentWeek ? 'text-white font-bold' : 'text-gray-300'}">${day}</span>
            ${hasEvents ? '<span class="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-purple-400"></span>' : ''}
        `;
        
        // Click handler to navigate to that week
        dayCell.addEventListener('click', () => {
            currentDate = new Date(dayDate);
            renderCalendar();
            renderWeeklySchedule();
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
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Check if a date is in the given week (starting from Monday)
 */
function isDateInWeek(date: Date, weekStart: Date): boolean {
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
    const weeklySchedule = document.getElementById('weeklySchedule');
    const weekRange = document.getElementById('weekRange');
    const weekNumber = document.getElementById('weekNumber');
    
    if (!weeklySchedule || !weekRange) return;
    
    // Get Monday of current week
    const monday = getMondayOfWeek(currentDate);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    // Update week range display
    weekRange.textContent = `${monthNames[monday.getMonth()]} ${monday.getFullYear()}`;
    
    // Calculate week number
    if (weekNumber) {
        const weekNum = getWeekNumber(monday);
        weekNumber.textContent = `Semana ${weekNum}`;
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
            } else {
                dayElement.classList.remove('text-purple-400');
            }
        }
    }
    
    // Clear schedule
    weeklySchedule.innerHTML = '';
    
    // Create time slots (00:00 to 23:00)
    for (let hour = 0; hour < 24; hour++) {
        const timeRow = document.createElement('div');
        timeRow.className = 'grid grid-cols-8 gap-2';
        
        // Time label (first column) - fixed width
        const timeLabel = document.createElement('div');
        timeLabel.className = 'text-xs text-gray-500 text-right pr-2 flex items-center justify-end h-12';
        timeLabel.textContent = `${String(hour).padStart(2, '0')}:00`;
        timeRow.appendChild(timeLabel);
        
        // Day columns (7 columns for days)
        for (let day = 0; day < 7; day++) {
            const dayDate = new Date(monday);
            dayDate.setDate(monday.getDate() + day);
            dayDate.setHours(hour, 0, 0, 0);
            
            const cell = document.createElement('div');
            cell.className = 'h-12 border border-gray-800 rounded relative hover:border-purple-500/50 cursor-pointer group bg-dark-card';
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
                    } else if (isFirstHour) {
                        // Event starts in this hour but continues
                        topOffset = (eventStartMin / 60) * 48;
                        height = 48 - topOffset; // Fill from start to end of hour
                    } else if (isLastHour) {
                        // Event ends in this hour but started earlier
                        topOffset = 0;
                        height = (eventEndMin / 60) * 48;
                    } else {
                        // Event spans the full hour (middle hours) - fill entire cell
                        topOffset = 0;
                        height = 48;
                    }
                    
                    // Ensure minimum height
                    height = Math.max(height, 24);
                    
                    const eventDiv = document.createElement('div');
                    eventDiv.className = `event-item ${getEventTypeClass(event.type)} text-xs p-1.5 rounded absolute left-0 right-0 z-10 cursor-pointer overflow-hidden flex items-center`;
                    eventDiv.style.height = `${height}px`;
                    eventDiv.style.top = `${topOffset}px`;
                    eventDiv.style.minHeight = `${height}px`;
                    eventDiv.textContent = event.title;
                    eventDiv.title = `${event.title} - ${event.start_time.substring(0, 5)} - ${event.end_time.substring(0, 5)}`;
                    eventDiv.dataset.eventId = event.id?.toString() || '';
                    
                    eventDiv.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (event.id) editEvent(event.id);
                    });
                    
                    cell.appendChild(eventDiv);
                });
            } else {
                // Show plus icon on hover only if cell is truly empty
                const plusIcon = document.createElement('div');
                plusIcon.className = 'add-event-btn absolute inset-0 flex items-center justify-center text-gray-600 group-hover:text-purple-400 opacity-0 group-hover:opacity-100 transition-all';
                plusIcon.innerHTML = '<i data-lucide="plus" class="w-4 h-4"></i>';
                cell.appendChild(plusIcon);
            }
            
            cell.addEventListener('click', (e) => {
                // Don't open modal if clicking on an event
                if ((e.target as HTMLElement).closest('.event-item')) return;
                selectedDate = dayDate;
                openEventModal(dayDate, hour);
            });
            
            timeRow.appendChild(cell);
        }
        
        weeklySchedule.appendChild(timeRow);
    }
    
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

/**
 * Get events for a specific date
 */
function getEventsForDate(date: Date): Event[] {
    const dateStr = formatDateForInput(date);
    return events.filter(event => event.date === dateStr);
}

/**
 * Get events for a specific date and hour (deprecated - use getEventsForDate instead)
 */
function getEventsForDateAndHour(date: Date, hour: number): Event[] {
    const dateStr = formatDateForInput(date);
    return events.filter(event => {
        if (event.date !== dateStr) return false;
        const startHour = parseInt(event.start_time.split(':')[0]);
        return startHour === hour;
    });
}

/**
 * Get CSS class for event type
 */
function getEventTypeClass(type: number): string {
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
function isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
}

/**
 * Get Monday of the week for a given date
 */
function getMondayOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
}

/**
 * Get week number of the year
 */
function getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format time for input field (HH:MM)
 */
function formatTimeForInput(time: string): string {
    return time.substring(0, 5); // Extract HH:MM from HH:MM:SS
}

/**
 * Open event modal
 */
function openEventModal(date?: Date, hour?: number) {
    const modal = document.getElementById('eventModal') as HTMLElement;
    const form = document.getElementById('eventForm') as HTMLFormElement;
    const modalTitle = document.getElementById('modalTitle') as HTMLElement;
    
    if (!modal || !form) return;
    
    // Reset form
    form.reset();
    currentEditingEvent = null;
    
    // Update subject dropdown
    updateSubjectDropdown();
    
    // Set default values
    const eventDate = date || selectedDate || new Date();
    const eventDateInput = document.getElementById('eventDate') as HTMLInputElement;
    const eventStartTime = document.getElementById('eventStartTime') as HTMLInputElement;
    const eventEndTime = document.getElementById('eventEndTime') as HTMLInputElement;
    
    if (eventDateInput) {
        eventDateInput.value = formatDateForInput(eventDate);
    }
    
    if (eventStartTime && hour !== undefined) {
        eventStartTime.value = `${String(hour).padStart(2, '0')}:00`;
    } else if (eventStartTime) {
        eventStartTime.value = '00:00';
    }
    
    if (eventEndTime && hour !== undefined) {
        eventEndTime.value = `${String(hour + 1).padStart(2, '0')}:00`;
    } else if (eventEndTime) {
        eventEndTime.value = '01:00';
    }
    
    if (modalTitle) {
        modalTitle.textContent = 'Nuevo Evento';
    }
    
    // Hide delete button for new events
    const deleteBtn = document.getElementById('deleteEventBtn') as HTMLElement;
    if (deleteBtn) {
        deleteBtn.style.display = 'none';
    }
    
    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        // Remove shadows from all icons in modal after they're created
        const removeShadows = () => {
            const modalIcons = modal.querySelectorAll('[data-lucide]');
            modalIcons.forEach(icon => {
                const iconEl = icon as HTMLElement;
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
                        const pathEl = path as any;
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
    const modal = document.getElementById('eventModal') as HTMLElement;
    if (modal) {
        modal.style.display = 'none';
        const form = document.getElementById('eventForm') as HTMLFormElement;
        if (form) form.reset();
        currentEditingEvent = null;
        
        // Hide delete button
        const deleteBtn = document.getElementById('deleteEventBtn') as HTMLElement;
        if (deleteBtn) {
            deleteBtn.style.display = 'none';
        }
    }
}

/**
 * Edit event
 */
function editEvent(eventId: number) {
    const event = events.find(e => e.id === eventId);
    if (!event) return;
    
    currentEditingEvent = event;
    const modal = document.getElementById('eventModal') as HTMLElement;
    const modalTitle = document.getElementById('modalTitle') as HTMLElement;
    const form = document.getElementById('eventForm') as HTMLFormElement;
    
    if (!modal || !form || !modalTitle) return;
    
    // Populate form
    (document.getElementById('eventTitle') as HTMLInputElement).value = event.title;
    (document.getElementById('eventDate') as HTMLInputElement).value = event.date;
    (document.getElementById('eventType') as HTMLSelectElement).value = event.type.toString();
    (document.getElementById('eventStartTime') as HTMLInputElement).value = formatTimeForInput(event.start_time);
    (document.getElementById('eventEndTime') as HTMLInputElement).value = formatTimeForInput(event.end_time);
    (document.getElementById('eventSubject') as HTMLSelectElement).value = event.subject?.toString() || '';
    (document.getElementById('eventNotes') as HTMLTextAreaElement).value = event.notes || '';
    
    modalTitle.textContent = 'Editar Evento';
    
    // Show delete button for existing events
    const deleteBtn = document.getElementById('deleteEventBtn') as HTMLElement;
    if (deleteBtn) {
        deleteBtn.style.display = 'block';
    }
    
    modal.style.display = 'flex';
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
        // Remove shadows from all icons in modal after they're created
        const removeShadows = () => {
            const modalIcons = modal.querySelectorAll('[data-lucide]');
            modalIcons.forEach(icon => {
                const iconEl = icon as HTMLElement;
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
                        const pathEl = path as any;
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
    const todayBtn = document.getElementById('todayBtn');
    
    if (prevWeekBtn) {
        prevWeekBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() - 7);
            renderCalendar();
            renderWeeklySchedule();
        });
    }
    
    if (nextWeekBtn) {
        nextWeekBtn.addEventListener('click', () => {
            currentDate.setDate(currentDate.getDate() + 7);
            renderCalendar();
            renderWeeklySchedule();
        });
    }
    
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            currentDate = new Date();
            renderCalendar();
            renderWeeklySchedule();
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
        deleteEventBtn.addEventListener('click', async () => {
            if (currentEditingEvent && currentEditingEvent.id) {
                const confirmed = await showConfirmModal(
                    '¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.',
                    'Eliminar Evento'
                );
                if (confirmed) {
                    await deleteEventById(currentEditingEvent.id);
                }
            }
        });
    }
    
    // Form submission
    const eventForm = document.getElementById('eventForm') as HTMLFormElement;
    if (eventForm) {
        eventForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveEvent();
        });
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
}

/**
 * Delete event by ID
 */
async function deleteEventById(eventId: number) {
    try {
        await deleteEvent(eventId);
        closeEventModal();
        await loadEvents();
    } catch (error) {
        console.error('Error deleting event:', error);
        await showAlertModal(
            'Error al eliminar el evento. Por favor, intenta nuevamente.',
            'Error'
        );
    }
}

/**
 * Save event (create or update)
 */
async function saveEvent() {
    const form = document.getElementById('eventForm') as HTMLFormElement;
    if (!form) return;
    
    const formData = new FormData(form);
    const title = formData.get('title') as string;
    const date = formData.get('date') as string;
    const type = parseInt(formData.get('type') as string);
    const start_time = formData.get('start_time') as string;
    const end_time = formData.get('end_time') as string;
    const subject = (formData.get('subject') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    
    try {
        const eventData: Partial<Event> = {
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
            await updateEvent(currentEditingEvent.id, eventData);
        } else {
            // Create new event
            await createEvent(eventData as Omit<Event, 'id' | 'created_at' | 'updated_at' | 'type_display'>);
        }
        
        closeEventModal();
        await loadEvents();
    } catch (error) {
        console.error('Error saving event:', error);
        await showAlertModal(
            'Error al guardar el evento. Por favor, intenta nuevamente.',
            'Error'
        );
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initPlanner);

