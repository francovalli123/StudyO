import { apiGet, apiPost, apiPut, apiDelete, getToken } from './api.js';

/**
 * Declare lucide icons library as global (loaded via CDN)
 * Provides icon rendering functionality throughout the application
 */
declare const lucide: {
    createIcons: () => void;
};

/**
 * Habit interface - Represents a daily habit with tracking data
 */
interface Habit {
    id: number; // Unique habit identifier
    name: string; // Habit name/description
    frequency: number; // How often the habit should be done
    streak: number; // Current consecutive completion count
    subject: number | null; // Associated subject ID, if any
    completed_today?: boolean; // Whether completed in current day
    is_key?: boolean; // Whether this is a priority habit
    created_at?: string; // Creation timestamp
}

/**
 * Subject interface - Links habits to academic subjects
 */
interface Subject {
    id: number; // Unique subject identifier
    name: string; // Subject name
}

/**
 * HabitWithStatus interface - Extended habit with UI state
 */
interface HabitWithStatus extends Habit {
    completedToday: boolean; // UI state for completion
    icon: string; // Lucide icon name
    color: string; // Color theme for UI
}

/**
 * Icon and color configuration for habit display
 * Each configuration includes icon name, color, and display name
 */
const ICON_CONFIGS = [
    { icon: 'zap', color: 'orange', name: 'Rayo' },
    { icon: 'book-open', color: 'green', name: 'Libro' },
    { icon: 'target', color: 'red', name: 'Objetivo' },
    { icon: 'coffee', color: 'blue', name: 'Café' },
    { icon: 'brain', color: 'purple', name: 'Cerebro' },
    { icon: 'clock', color: 'yellow', name: 'Reloj' },
    { icon: 'flame', color: 'orange', name: 'Llama' },
    { icon: 'trophy', color: 'gold', name: 'Trofeo' },
];

/**
 * Color classes mapping - Defines Tailwind classes for each color theme
 * Includes card background, text color, icon color, and checkbox styling
 */
const COLOR_CLASSES: { [key: string]: { card: string; text: string; icon: string; check: string } } = {
    orange: {
        card: 'bg-orange-950/40 border-orange-500/30 hover:bg-orange-900/40',
        text: 'text-orange-400',
        icon: 'text-orange-500',
        check: 'bg-orange-500 border-orange-500 text-black'
    },
    green: {
        card: 'bg-green-950/40 border-green-500/30 hover:bg-green-900/40',
        text: 'text-green-400',
        icon: 'text-green-500',
        check: 'bg-green-500 border-green-500 text-black'
    },
    red: {
        card: 'bg-red-950/40 border-red-500/30 hover:bg-red-900/40',
        text: 'text-red-400',
        icon: 'text-red-500',
        check: 'bg-red-500 border-red-500 text-white'
    },
    blue: {
        card: 'bg-blue-950/40 border-blue-500/30 hover:bg-blue-900/40',
        text: 'text-blue-400',
        icon: 'text-blue-500',
        check: 'bg-blue-500 border-blue-500 text-white'
    },
    purple: {
        card: 'bg-purple-950/40 border-purple-500/30 hover:bg-purple-900/40',
        text: 'text-purple-400',
        icon: 'text-purple-500',
        check: 'bg-purple-500 border-purple-500 text-white'
    },
    yellow: {
        card: 'bg-yellow-950/40 border-yellow-500/30 hover:bg-yellow-900/40',
        text: 'text-yellow-400',
        icon: 'text-yellow-500',
        check: 'bg-yellow-500 border-yellow-500 text-black'
    },
    gold: {
        card: 'bg-amber-950/40 border-amber-500/30 hover:bg-amber-900/40',
        text: 'text-amber-400',
        icon: 'text-amber-500',
        check: 'bg-amber-500 border-amber-500 text-black'
    }
};

/**
 * Get today's date key for local storage
 * Returns date in YYYY-MM-DD format
 * Automatically updates when midnight passes (local timezone)
 * @returns Date string for today in YYYY-MM-DD format
 */
function getTodayKey(): string {
    // Returns browser's local date "YYYY-MM-DD"
    // Automatically changes after local midnight
    const localDate = new Date();
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Get today's completed habits from local storage
 * Cleans up old day entries to prevent localStorage bloat
 * @returns Set of habit IDs completed today
 */
function getTodayCompletions(): Set<number> {
    const currentKey = `habit_completions_${getTodayKey()}`;
    
    // 1. Search all local storage keys
    // If old day keys found, delete them to prevent accumulation
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('habit_completions_') && key !== currentKey) {
            localStorage.removeItem(key); // Delete yesterday's cache
        }
    }

    // 2. Get today's completions
    const stored = localStorage.getItem(currentKey);
    return stored ? new Set(JSON.parse(stored)) : new Set();
}

/**
 * Save today's completed habits to local storage
 * @param completions - Set of habit IDs completed today
 */
function saveTodayCompletions(completions: Set<number>) {
    const key = `habit_completions_${getTodayKey()}`;
    localStorage.setItem(key, JSON.stringify([...completions]));
}

let todayCompletions = getTodayCompletions();

// Global state variables
let habits: HabitWithStatus[] = [];
let subjects: Subject[] = [];
let editingHabitId: number | null = null; // ID of habit being edited
let selectedIcon = 'zap'; // Selected icon for new habit
let selectedColor = 'orange'; // Selected color for new habit

/**
 * Update daily progress bar with completion percentage
 * @param completed - Number of habits completed today
 * @param total - Total number of habits
 */
function updateDailyProgress(completed: number, total: number) {
    // Calculate percentage of daily completion
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    const bar = document.getElementById("dailyProgressBar") as HTMLElement;
    const text = document.getElementById("dailyProgressText") as HTMLElement;

    // Update progress bar width and data attribute
    if (bar) {
        bar.style.width = `${percent}%`;
        bar.setAttribute("data-progress", `${percent}`);
    }

    // Update progress text display
    if (text) {
        text.textContent = `${percent}%`;
    }
}

/**
 * Load habits from the backend API and synchronize with local completion status
 * Ensures that server data takes precedence over local storage
 * Updates the global habits array with UI-ready data including icons and colors
 * @returns Promise<void> - Fetches habits and renders them to the DOM
 */
async function loadHabits() {
    try {
        const token = getToken();
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // 1. Fetch fresh habit data from the backend API
        const habitsData: Habit[] = await apiGet('/habits/');

        // 2. Get the current local completion set (cleaning old date keys if day changed)
        todayCompletions = getTodayCompletions();

        // 3. Map API habits to display format with icon/color configuration
        habits = habitsData.map(h => {
            // Server truth: h.completed_today from backend is the single source of truth
            // Local storage is always synchronized to match server state
            
            const serverSaysCompleted = h.completed_today || false;

            // Sync local storage with server: Correct local state if it differs from server
            if (serverSaysCompleted) {
                todayCompletions.add(h.id);
            } else {
                todayCompletions.delete(h.id);
            }

            // Get the configured icon and color for this habit (stored in localStorage)
            const iconConfig = getIconForHabit(h);
            
            // Return habit with UI-friendly data: completion status from server, icon/color config
            return {
                ...h,
                completedToday: serverSaysCompleted, // Use server value for completion status
                icon: iconConfig.icon,
                color: iconConfig.color
            };
        });

        // 4. Save the synchronized completion state back to localStorage
        saveTodayCompletions(todayCompletions);

        renderHabits();

        updateDailyProgress(
            habits.filter(h => h.completedToday).length,
            habits.length
        );

    } catch (error) {
        console.error("Error loading habits:", error);
    }
}

/**
 * Load all available subjects from the backend and populate the subject dropdown
 * Used in the habit creation/edit modal to associate habits with subjects
 * @returns Promise<void> - Fetches subjects and updates the form dropdown
 */
async function loadSubjects() {
    try {
        // Fetch all subjects from the backend API
        subjects = await apiGet('/subjects/');
        const sel = document.getElementById('habitSubject') as HTMLSelectElement;
        if (sel) {
            // Populate dropdown with default "None" option plus all available subjects
            sel.innerHTML =
                `<option value="">None</option>` +
                subjects.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * Retrieve the icon and color configuration for a habit
 * First checks localStorage for user-saved preference, then falls back to name-based defaults
 * @param habit - The habit object to get icon configuration for
 * @returns Object with icon and color properties
 */
function getIconForHabit(habit: Habit) {
    // Check if user has previously saved an icon/color preference for this habit
    const stored = localStorage.getItem(`habit_${habit.id}_icon`);
    if (stored) return JSON.parse(stored);

    // Fallback: Auto-assign icon based on habit name patterns
    const name = habit.name.toLowerCase();

    // Spanish keywords for study-related habits
    if (name.includes("estudiar") || name.includes("pomodoro"))
        return { icon: "zap", color: "orange" };
    // Spanish keywords for reading/review habits
    if (name.includes("leer") || name.includes("repasar"))
        return { icon: "book-open", color: "green" };

    // Default to lightning bolt icon with orange color
    return { icon: "zap", color: "orange" };
}

/**
 * Save the user's chosen icon and color preference for a habit to localStorage
 * Persists visual customization across browser sessions
 * @param habitId - The ID of the habit to customize
 * @param icon - Lucide icon name to use for this habit
 * @param color - Color theme name (orange, green, red, blue, purple, yellow, gold)
 */
function saveIconForHabit(habitId: number, icon: string, color: string) {
    // Store icon and color preference in localStorage for persistence
    localStorage.setItem(`habit_${habitId}_icon`, JSON.stringify({ icon, color }));
}

/**
 * Render all habits to the DOM as interactive cards
 * Shows empty state if no habits exist, otherwise displays grid of habit cards
 * Each card includes habit name, streak count, and completion toggle button
 */
function renderHabits() {
    // Get references to the grid container and empty state message
    const grid = document.getElementById("habitsGrid");
    const emptyState = document.getElementById("emptyState");
    
    if (!grid || !emptyState) return;

    // Check if there are any habits to display
    if (habits.length === 0) {
        // No habits: Show empty state message and hide the grid
        grid.innerHTML = "";                // Clear grid HTML
        grid.classList.add("hidden");       // Hide habits grid
        emptyState.classList.remove("hidden"); // Show empty state
        emptyState.classList.add("flex");   // Enable flexbox display for centering
        return; 
    }

    // Habits exist: Show grid and hide empty state
    emptyState.classList.add("hidden");     // Hide empty state message
    emptyState.classList.remove("flex");
    grid.classList.remove("hidden");        // Show habits grid

    // Render habit cards with dynamic styling based on color theme and completion status
    grid.innerHTML = habits.map(habit => {
        // Get color theme configuration for this habit
        const color = COLOR_CLASSES[habit.color] || COLOR_CLASSES.orange;
        const completed = habit.completedToday;

        // Return HTML card with dynamic styling classes based on habit's color theme
        return `
        <div class="relative group rounded-2xl p-6 border transition-all duration-300 ${color.card}">
            <div class="flex items-start gap-4">
                <div class="flex-1 min-w-0 pr-10">
                    <div class="flex items-center gap-3 mb-2">
                        <i data-lucide="${habit.icon}" class="w-6 h-6 ${completed ? "text-gray-600" : color.icon}"></i>
                        <h3 class="font-bold text-lg truncate ${completed ? "line-through text-gray-500" : "text-white"}">
                            ${habit.name}
                        </h3>
                    </div>
                    <div class="flex items-center gap-2 text-sm font-medium ${completed ? "text-gray-600" : color.text}">
                        <i data-lucide="trending-up" class="w-4 h-4"></i>
                        <span>Racha: ${habit.streak}</span>
                    </div>
                </div>
            </div>

            <button 
                class="habit-complete-btn absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all"
                data-habit-id="${habit.id}" 
                data-completed="${completed}">
                ${completed ? `<i data-lucide="check" class="w-4 h-4"></i>` : ""}
            </button>
        </div>`;
    }).join("");

    if (typeof lucide !== 'undefined') lucide.createIcons();
    attachHabitEventListeners();
}

/**
 * Handle the submission of the habit creation/edit form
 * Sends habit data to the backend API and updates the habits list
 * @param e - The form submission event
 * @returns Promise<void> - Creates habit and refreshes the display
 */
async function handleSaveHabit(e: Event) {
    // Prevent default form submission (page reload)
    e.preventDefault();

    // Show loading state on submit button
    const submitBtn = document.querySelector('#habitForm button[type="submit"]') as HTMLButtonElement;
    const originalText = submitBtn.innerText;
    submitBtn.innerText = "Saving...";
    submitBtn.disabled = true;

    try {
        // Extract form data
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        // Parse form fields into appropriate types
        const name = formData.get('name') as string;
        const frequency = parseInt(formData.get('frequency') as string);
        const subjectValue = formData.get('subject') as string;
        const subject = subjectValue ? parseInt(subjectValue) : null;
        const isKey = formData.get('is_key') === 'on' || formData.get('is_key') === 'true';

        // Build API payload
        const payload = {
            name,
            frequency,
            subject,
            is_key: isKey
        };

        // Send habit data to backend API
        const newHabit = await apiPost('/habits/', payload, true);

        // Save the user's selected icon/color preference locally (backend doesn't store this)
        saveIconForHabit(newHabit.id, selectedIcon, selectedColor);

        // Close modal and refresh habits list to show the new habit
        closeCreateModal();
        loadHabits(); // Reload habits to see newly created habit

    } catch (error) {
        // Handle and report error to user
        console.error("Error saving habit:", error);
        alert("Error creating habit. Check the console for details.");
    } finally {
        // Restore submit button to original state
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
}

/**
 * Attach click event listeners to all habit completion toggle buttons
 * Called after rendering habits to enable completion status toggling
 */
function attachHabitEventListeners() {
    // Find all completion buttons and attach click handlers
    document.querySelectorAll('.habit-complete-btn').forEach(button => {
        button.addEventListener('click', async (e) => {
            // Extract habit ID and current completion status from button attributes
            const btn = e.currentTarget as HTMLButtonElement;
            const id = Number(btn.dataset.habitId);
            const completed = btn.dataset.completed === "true";
            // Toggle completion status: if completed, mark incomplete, and vice versa
            await toggleHabitCompletion(id, !completed);
        });
    });
}

/**
 * Toggle a habit's completion status for today
 * Updates both local state and backend via API
 * Handles streak calculation and UI updates with optimistic rendering
 * @param habitId - ID of the habit to toggle
 * @param complete - True to mark as complete, false to mark as incomplete
 * @returns Promise<void> - Updates backend and refreshes UI
 */
async function toggleHabitCompletion(habitId: number, complete: boolean) {
    // Verify user is authenticated
    const token = getToken();
    if (!token) return;

    // Find the habit in the global habits array
    const index = habits.findIndex(h => h.id === habitId);
    if (index === -1) return;

    // Save previous state for rollback on error
    const previousState = habits[index].completedToday;
    const previousStreak = habits[index].streak;

    try {
        // Update local state optimistically (for instant UI feedback)
        habits[index].completedToday = complete;
        // Don't guess the streak here - let the API calculate it correctly
        // Streak will be updated from the API response

        // Update local completion tracking
        if (complete) todayCompletions.add(habitId);
        else todayCompletions.delete(habitId);

        // Persist updated completion set to localStorage
        saveTodayCompletions(todayCompletions);

        // Update progress bar immediately for responsive UX
        updateDailyProgress(
            habits.filter(h => h.completedToday).length,
            habits.length
        );

        // Refresh habit display with updated UI state
        renderHabits();

        // Send completion toggle to backend API
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

        // Handle API errors
        if (!response.ok) throw new Error("Error API");

        // Update the streak with the correct value calculated by the server
        const data = await response.json();
        if (data.streak !== undefined) {
            habits[index].streak = data.streak;
            renderHabits();
        }

    } catch (err) {
        // Rollback optimistic update on error
        habits[index].completedToday = previousState;
        habits[index].streak = previousStreak;

        // Notify user of connection error
        alert("Connection error. Changes were not saved.");

        // Refresh UI with reverted state
        renderHabits();
        updateDailyProgress(
            habits.filter(h => h.completedToday).length,
            habits.length
        );
    }
}

window.addEventListener("DOMContentLoaded", () => {
    loadSubjects();
    loadHabits();
    attachGlobalListeners(); 
});


/**
 * Attach global event listeners to modal controls and form elements
 * Sets up click handlers for add habit buttons and form submission
 * Called on page load and ensures listeners are properly attached
 */
function attachGlobalListeners(): void {
    // Get references to all modal control buttons
    const createBtn = document.getElementById('addHabitBtn') as HTMLButtonElement | null;
    const emptyStateBtn = document.getElementById('emptyStateAddBtn') as HTMLButtonElement | null;
    const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement | null;
    const closeModalBtn = document.getElementById('closeModalBtn') as HTMLButtonElement | null;

    // Get reference to the habit creation form
    const habitForm = document.getElementById('habitForm') as HTMLFormElement | null;

    // Attach click handler to primary "Add Habit" button
    if (createBtn) {
        createBtn.addEventListener('click', () => {
            prepareCreateModal();
            openCreateModal();
        });
    }

    // Attach click handler to "Add" button in empty state message
    if (emptyStateBtn) {
        emptyStateBtn.addEventListener('click', () => {
            prepareCreateModal();
            openCreateModal();
        });
    }

    // Attach click handlers for modal dismissal (Cancel button and close button)
    if (cancelBtn) cancelBtn.addEventListener('click', closeCreateModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeCreateModal);

    // Attach form submission handler to create/update habit
    if (habitForm) {
        // Remove any existing listeners to prevent duplicate submissions
        habitForm.removeEventListener('submit', handleSaveHabit); 
        habitForm.addEventListener('submit', handleSaveHabit);
    }
}

/**
 * Prepare the habit creation modal for opening
 * Resets form data and UI state to default values
 * @returns void - Resets form and icon selection UI
 */
function prepareCreateModal() {
    // Clear any existing habit being edited
    editingHabitId = null;
    // Reset icon and color to default values
    selectedIcon = 'zap';
    selectedColor = 'orange';
    
    // Clear all form input values
    const form = document.getElementById('habitForm') as HTMLFormElement | null;
    if (form) form.reset();
    
    // Render the icon selection grid with default selections
    renderIconsSelection(); 
}

/**
 * Open the habit creation modal with fade-in animation
 * Shows the modal overlay and animates the modal content
 * @returns void - Displays modal to user
 */
function openCreateModal(): void {
    // Get the modal overlay element
    const modal = document.getElementById('habitModal');
    if (modal) {
        // Add 'active' class which CSS uses to display the modal
        modal.classList.add('active'); 
        
        // Apply fade-in animation to modal content
        const content = modal.querySelector('.modal-content');
        if(content) {
            // Remove any fade-out animation from previous close
            content.classList.remove('animate-fade-out');
            // Add fade-in animation for entrance
            content.classList.add('animate-fade-in');
        }
    }
}

/**
 * Close the habit creation modal with fade-out animation
 * Hides the modal overlay and resets form state
 * @returns void - Hides modal from user
 */
function closeCreateModal(): void {
    // Get the modal overlay element
    const modal = document.getElementById('habitModal');
    if (modal) {
        // Remove 'active' class which CSS uses to hide the modal
        modal.classList.remove('active');
    }
}

/**
 * Render the icon selection grid in the habit creation modal
 * Displays all available icon/color combinations for user selection
 * Highlights the currently selected icon with visual styling
 * @returns void - Updates DOM with icon selection interface
 */
function renderIconsSelection() {
    // Find the grid container in the habit form
    const container = document.querySelector('#habitForm .grid');
    if (!container) return;

    // Generate HTML for each icon/color option with dynamic styling
    container.innerHTML = ICON_CONFIGS.map(config => `
        <div class="icon-option cursor-pointer p-3 rounded-xl border border-gray-700 bg-dark-input hover:border-${config.color}-500 flex items-center justify-center transition-all ${selectedIcon === config.icon ? `border-${config.color}-500 bg-${config.color}-500/10 ring-2 ring-${config.color}-500/50` : ''}"
             onclick="selectIcon('${config.icon}', '${config.color}')">
            <i data-lucide="${config.icon}" class="w-6 h-6 text-${config.color}-500"></i>
        </div>
    `).join('');
    
    // Initialize lucide icons for the newly rendered icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
    
    // Expose selectIcon function globally so inline onclick handlers work
    (window as any).selectIcon = (icon: string, color: string) => {
        // Update global selection state
        selectedIcon = icon;
        selectedColor = color;
        // Re-render to show visual selection feedback
        renderIconsSelection();
    };
}