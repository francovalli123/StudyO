var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Import API utility functions and authentication helper
import { apiGet, apiPost, apiDelete, getToken, apiPut } from "./api.js";
import { initConfirmModal, showConfirmModal } from "./confirmModal.js";
import { translations, getCurrentLanguage } from "./i18n.js";
// Global state: stores all subjects fetched from API
let subjects = [];
// Global state: stores the ID of the subject being edited (null if creating new)
let currentSubjectId = null;
/**
 * Load all subjects from API and render them in the UI
 * Displays empty state if no subjects exist, otherwise renders subject cards
 */
function loadSubjects() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const transAll = translations[getCurrentLanguage()];
            const transSubjects = transAll.subjects;
            const common = transAll.common;
            // Fetch subjects from backend API
            subjects = yield apiGet("/subjects/");
            // Debug log: show loaded subjects and auth token for permission verification
            console.debug('Loaded subjects:', subjects, 'authToken:', getToken());
            const container = document.getElementById("subjects-container");
            const emptyState = document.getElementById("emptyState");
            if (!container || !emptyState)
                return;
            // Show empty state if no subjects exist
            if (subjects.length === 0) {
                container.innerHTML = "";
                container.classList.add("hidden");
                emptyState.classList.remove("hidden");
                const emptyTitle = emptyState.querySelector('h3');
                const emptyDesc = emptyState.querySelector('p');
                const btn = document.getElementById('emptyStateSubjectBtn');
                if (emptyTitle)
                    emptyTitle.textContent = transSubjects.emptyTitle;
                if (emptyDesc)
                    emptyDesc.textContent = transSubjects.emptyDesc;
                if (btn) {
                    const span = btn.querySelector('span');
                    if (span)
                        span.textContent = transSubjects.createFirst;
                }
                return;
            }
            // Show subjects container and hide empty state
            emptyState.classList.add("hidden");
            container.classList.remove("hidden");
            // Render subject cards using template literals
            container.innerHTML = subjects
                .map((s) => `
                <div class="bg-dark-card rounded-2xl p-6 relative group" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.2), 0 0 30px rgba(168,85,247,0.15), inset 0 0 20px rgba(168,85,247,0.03);">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-fuchsia-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                                <i data-lucide="book-open" class="w-5 h-5 text-purple-400"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-bold text-white">${s.name}</h3>
                                <p class="text-sm text-gray-400 mt-1">${transSubjects.professorShort} ${s.professor_name || transSubjects.notSpecified}</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-400">${transSubjects.progressLabel}</span>
                            <span class="text-sm font-bold text-purple-400">${s.progress || 0}%</span>
                        </div>
                        <div class="text-xs text-gray-400 mb-2">${(transSubjects.weeklyMinutesLabel || '').replace('{done}', String(s.study_minutes_week || 0)).replace('{target}', String(s.weekly_target_minutes || 0))} </div>
                        <div class="w-full h-2 rounded-full bg-gray-700/50" style="box-shadow: inset 0 0 10px rgba(0,0,0,0.3);">
                            <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style="width: ${s.progress || 0}%; box-shadow: 0 0 15px rgba(168,85,247,0.6);"></div>
                        </div>
                    </div>

                    ${s.next_exam_date ? `<div class="mb-4 text-xs text-gray-400"><i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i> ${transSubjects.nextExam}: ${s.next_exam_date}</div>` : ''}

                    <div class="flex gap-3 pt-4 border-t border-gray-700/50">
                        <button class="edit-subject-btn flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-subject-id="${s.id}">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                            <span>${transSubjects.editAction || common.edit}</span>
                        </button>
                        <button class="delete-subject-btn flex-1 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-subject-id="${s.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            <span>${transSubjects.deleteAction || common.delete}</span>
                        </button>
                    </div>
                </div>
            `)
                .join("");
            // Initialize lucide icons for newly rendered elements
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
            // Attach event listeners to edit and delete buttons
            attachSubjectEventListeners();
        }
        catch (error) {
            console.error("Error loading subjects:", error);
            const container = document.getElementById("subjects-container");
            if (container) {
                container.innerHTML = `<p class="text-red-400 col-span-full">Error loading subjects</p>`;
            }
        }
    });
}
/**
 * Attach event listeners to subject edit and delete buttons
 * Uses event delegation pattern for efficient event handling
 */
function attachSubjectEventListeners() {
    const container = document.getElementById('subjects-container');
    if (!container)
        return;
    // Event delegation: single listener handles all edit/delete button clicks
    container.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
        const target = e.target;
        // Handle edit button clicks
        const editBtn = target.closest('.edit-subject-btn');
        if (editBtn) {
            const idStr = editBtn.dataset.subjectId;
            if (idStr)
                openSubjectModal(parseInt(idStr));
            return;
        }
        // Handle delete button clicks
        const deleteBtn = target.closest('.delete-subject-btn');
        if (deleteBtn) {
            const idStr = deleteBtn.dataset.subjectId;
            if (idStr)
                yield deleteSubject(parseInt(idStr));
            return;
        }
    }));
}
/**
 * Delete a subject after user confirmation
 * Makes API call to remove subject and reloads the list
 * @param subjectId - ID of the subject to delete
 */
function deleteSubject(subjectId) {
    return __awaiter(this, void 0, void 0, function* () {
        const transAll = translations[getCurrentLanguage()];
        const confirmed = yield showConfirmModal(transAll.confirmations.deleteSubjectMessage, transAll.confirmations.deleteSubjectTitle);
        if (!confirmed)
            return;
        try {
            // Call API to delete the subject
            yield apiDelete(`/subjects/${subjectId}/`);
            // Reload subjects list after deletion
            loadSubjects();
        }
        catch (error) {
            console.error("Error deleting subject:", error);
            // Attempt to parse error from API for better user feedback
            try {
                const errAny = error;
                let parsed = null;
                if (typeof errAny === 'string') {
                    parsed = JSON.parse(errAny);
                }
                else if (errAny && typeof errAny.message === 'string') {
                    try {
                        parsed = JSON.parse(errAny.message);
                    }
                    catch (inner) {
                        parsed = errAny;
                    }
                }
                else {
                    parsed = errAny;
                }
                if (parsed && parsed.detail && String(parsed.detail).includes('No Subject matches')) {
                    alert('Subject not found or you don\'t have permission to delete it.');
                }
                else {
                    alert('Error deleting subject.');
                }
            }
            catch (e) {
                alert('Error deleting subject');
            }
        }
    });
}
/**
 * Handle subject form submission for create or update operations
 * Validates form data and makes appropriate API call (POST for create, PUT for update)
 * @param e - Form submit event
 */
function handleSaveSubject(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const transAll = translations[getCurrentLanguage()];
        const common = transAll.common;
        const subjTrans = transAll.subjects;
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        // Check if editing or creating (ID set by openSubjectModal)
        const isEditing = currentSubjectId !== null;
        submitBtn.innerText = common.loading;
        submitBtn.disabled = true;
        try {
            const formData = new FormData(form);
            // Convert form data to payload object
            const payload = {
                name: formData.get('name'),
                professor_name: formData.get('professor_name') || undefined,
                color: formData.get('color') || undefined,
                next_exam_date: formData.get('next_exam_date') || undefined,
                // Parse weekly target minutes as safe number
                weekly_target_minutes: (() => {
                    const raw = formData.get('weekly_target_minutes');
                    if (!raw)
                        return undefined;
                    const n = Number(raw);
                    return isNaN(n) ? undefined : Math.max(0, Math.floor(n));
                })()
            };
            // Parse priority value from form
            const priorityValue = formData.get('priority');
            payload.priority = priorityValue ? parseInt(priorityValue) : undefined;
            if (isEditing) {
                // Update existing subject with PUT request
                yield apiPut(`/subjects/${currentSubjectId}/`, payload);
                console.log("Subject updated successfully!");
            }
            else {
                // Create new subject with POST request
                yield apiPost('/subjects/', payload, true);
                console.log("Subject created successfully!");
            }
            // Close modal and reload subjects list
            closeSubjectModal();
            loadSubjects();
        }
        catch (error) {
            console.error(`Error ${isEditing ? 'updating' : 'saving'} subject:`, error);
            alert(`Error ${isEditing ? 'updating' : 'creating'} subject. Check console.`);
        }
        finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            currentSubjectId = null; // Clear editing ID after operation
        }
    });
}
/**
 * Open subject modal for creating a new subject or editing an existing one
 * Pre-populates form with existing data if editing
 * @param subjectId - ID to edit, or null to create new subject
 */
function openSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    const form = document.getElementById('subjectForm');
    const transAll = translations[getCurrentLanguage()];
    const subjTrans = transAll.subjects;
    if (!modal || !form)
        return;
    currentSubjectId = subjectId; // Set ID (null for create, id for edit)
    form.reset();
    const title = modal.querySelector('h2');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (subjectId !== null) {
        // Edit mode: find subject and populate form with existing data
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
            // Populate form fields with subject data
            const nameInput = form.querySelector('[name="name"]');
            const profInput = form.querySelector('[name="professor_name"]');
            const priorityInput = form.querySelector('[name="priority"]');
            const colorInput = form.querySelector('[name="color"]');
            const examInput = form.querySelector('[name="next_exam_date"]');
            if (nameInput)
                nameInput.value = subject.name;
            if (profInput)
                profInput.value = subject.professor_name || '';
            if (priorityInput)
                priorityInput.value = subject.priority ? String(subject.priority) : '';
            if (colorInput)
                colorInput.value = subject.color || '';
            const targetInput = form.querySelector('[name="weekly_target_minutes"]');
            if (targetInput)
                targetInput.value = subject.weekly_target_minutes ? String(subject.weekly_target_minutes) : '';
            if (subject.next_exam_date && examInput) {
                // Assuming `next_exam_date` comes in a compatible format for input[type=date]
                examInput.value = subject.next_exam_date;
            }
            if (title)
                title.innerText = subjTrans.editSubject;
            if (submitBtn)
                submitBtn.innerText = subjTrans.updateSubject;
        }
    }
    else {
        // Create mode: show empty form
        if (title)
            title.innerText = subjTrans.newSubject;
        if (submitBtn)
            submitBtn.innerText = subjTrans.createSubject;
    }
    modal.classList.add('active');
}
/**
 * Close the subject modal
 */
function closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) {
        modal.classList.remove('active');
    }
}
/**
 * Attach global event listeners for subject management buttons and modal
 * Handles add subject, close modal, form submission, and background click events
 */
function attachGlobalListeners() {
    const addBtn = document.getElementById('addSubjectBtn');
    const closeModalBtn = document.getElementById('closeSubjectModalBtn');
    const cancelBtn = document.getElementById('cancelSubjectBtn');
    const subjectForm = document.getElementById('subjectForm');
    const emptyStateBtn = document.getElementById('emptyStateSubjectBtn');
    const modal = document.getElementById('subjectModal');
    // Bind add subject button (use arrow function to avoid passing Event object)
    if (addBtn)
        addBtn.addEventListener('click', () => openSubjectModal(null));
    if (emptyStateBtn)
        emptyStateBtn.addEventListener('click', () => openSubjectModal(null));
    // Bind modal close buttons
    if (closeModalBtn)
        closeModalBtn.addEventListener('click', closeSubjectModal);
    if (cancelBtn)
        cancelBtn.addEventListener('click', closeSubjectModal);
    // Bind form submission
    if (subjectForm)
        subjectForm.addEventListener('submit', handleSaveSubject);
    // Close modal on background click
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal)
                closeSubjectModal();
        });
    }
}
// Initialize when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    initConfirmModal();
    attachGlobalListeners();
    loadSubjects();
});
