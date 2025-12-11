var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiGet, apiPost, apiDelete, getToken, apiPut } from "./api.js";
let subjects = [];
let currentSubjectId = null; // Variable para almacenar el ID en edición
function loadSubjects() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            subjects = yield apiGet("/subjects/");
            // Debug: mostrar token y objetos recibidos para comprobar ownership/permits
            console.debug('Loaded subjects:', subjects, 'authToken:', getToken());
            const container = document.getElementById("subjects-container");
            const emptyState = document.getElementById("emptyState");
            if (!container || !emptyState)
                return;
            if (subjects.length === 0) {
                container.innerHTML = "";
                container.classList.add("hidden");
                emptyState.classList.remove("hidden");
                return;
            }
            emptyState.classList.add("hidden");
            container.classList.remove("hidden");
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
                                <p class="text-sm text-gray-400 mt-1">Prof. ${s.professor_name || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-400">Avance Clave</span>
                            <span class="text-sm font-bold text-purple-400">${s.progress || 0}%</span>
                        </div>
                        <div class="text-xs text-gray-400 mb-2">${s.study_minutes_week || 0} / ${s.weekly_target_minutes || 0} min esta semana</div>
                        <div class="w-full h-2 rounded-full bg-gray-700/50" style="box-shadow: inset 0 0 10px rgba(0,0,0,0.3);">
                            <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style="width: ${s.progress || 0}%; box-shadow: 0 0 15px rgba(168,85,247,0.6);"></div>
                        </div>
                    </div>

                    ${s.next_exam_date ? `<div class="mb-4 text-xs text-gray-400"><i data-lucide="calendar" class="w-3 h-3 inline mr-1"></i> Próximo examen: ${s.next_exam_date}</div>` : ''}

                    <div class="flex gap-3 pt-4 border-t border-gray-700/50">
                        <button class="edit-subject-btn flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-subject-id="${s.id}">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                            <span>Editar</span>
                        </button>
                        <button class="delete-subject-btn flex-1 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-subject-id="${s.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            <span>Eliminar</span>
                        </button>
                    </div>
                </div>
            `)
                .join("");
            if (typeof lucide !== 'undefined')
                lucide.createIcons();
            attachSubjectEventListeners();
        }
        catch (error) {
            console.error("Error al cargar materias:", error);
            const container = document.getElementById("subjects-container");
            if (container) {
                container.innerHTML = `<p class="text-red-400 col-span-full">Error al cargar las materias</p>`;
            }
        }
    });
}
function attachSubjectEventListeners() {
    const container = document.getElementById('subjects-container');
    if (!container)
        return;
    // Use event delegation: single listener on the container handles edit/delete clicks
    container.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
        const target = e.target;
        const editBtn = target.closest('.edit-subject-btn');
        if (editBtn) {
            const idStr = editBtn.dataset.subjectId;
            if (idStr)
                openSubjectModal(parseInt(idStr));
            return;
        }
        const deleteBtn = target.closest('.delete-subject-btn');
        if (deleteBtn) {
            const idStr = deleteBtn.dataset.subjectId;
            if (idStr)
                yield deleteSubject(parseInt(idStr));
            return;
        }
    }));
}
function deleteSubject(subjectId) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!confirm('¿Estás seguro de que quieres eliminar esta materia?'))
            return;
        try {
            yield apiDelete(`/subjects/${subjectId}/`);
            loadSubjects();
        }
        catch (error) {
            console.error("Error al eliminar materia:", error);
            // Intentamos parsear el error devuelto por la API para dar feedback más claro
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
                    alert('No se encontró la asignatura o no tienes permiso para eliminarla.');
                }
                else {
                    alert('Error al eliminar la materia');
                }
            }
            catch (e) {
                alert('Error al eliminar la materia');
            }
        }
    });
}
function handleSaveSubject(e) {
    return __awaiter(this, void 0, void 0, function* () {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerText;
        // El ID se obtiene de la variable global establecida por openSubjectModal
        const isEditing = currentSubjectId !== null;
        submitBtn.innerText = isEditing ? "Actualizando..." : "Guardando...";
        submitBtn.disabled = true;
        try {
            const formData = new FormData(form);
            // Convertir formData a un objeto para el payload
            const payload = {
                name: formData.get('name'),
                professor_name: formData.get('professor_name') || undefined,
                color: formData.get('color') || undefined,
                next_exam_date: formData.get('next_exam_date') || undefined,
                weekly_target_minutes: (() => {
                    const raw = formData.get('weekly_target_minutes');
                    if (!raw)
                        return undefined;
                    const n = Number(raw);
                    return isNaN(n) ? undefined : Math.max(0, Math.floor(n));
                })()
            };
            const priorityValue = formData.get('priority');
            payload.priority = priorityValue ? parseInt(priorityValue) : undefined;
            if (isEditing) {
                // Lógica de EDICIÓN (PUT/PATCH)
                yield apiPut(`/subjects/${currentSubjectId}/`, payload);
                console.log("Materia actualizada exitosamente!");
            }
            else {
                // Lógica de CREACIÓN (POST)
                // Mantenemos 3 argumentos en apiPost asumiendo que es la firma correcta para POST
                yield apiPost('/subjects/', payload, true);
                console.log("Materia creada exitosamente!");
            }
            closeSubjectModal();
            loadSubjects();
        }
        catch (error) {
            console.error(`Error al ${isEditing ? 'actualizar' : 'guardar'} materia:`, error);
            alert(`Hubo un error al ${isEditing ? 'actualizar' : 'crear'} la materia. Revisa la consola.`);
        }
        finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
            currentSubjectId = null; // Limpiar el ID después de la operación
        }
    });
}
function openSubjectModal(subjectId = null) {
    const modal = document.getElementById('subjectModal');
    const form = document.getElementById('subjectForm');
    if (!modal || !form)
        return;
    currentSubjectId = subjectId; // Establecer el ID (null para crear, id para editar)
    form.reset();
    const title = modal.querySelector('h2'); // Asumiendo que tienes un h2 en el modal
    const submitBtn = form.querySelector('button[type="submit"]');
    if (subjectId !== null) {
        // Encontrar la materia y rellenar el formulario (EDITAR)
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
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
                // Asumiendo que `next_exam_date` ya viene en formato compatible con input[type=date]
                examInput.value = subject.next_exam_date;
            }
            if (title)
                title.innerText = 'Editar Materia';
            if (submitBtn)
                submitBtn.innerText = 'Guardar Cambios';
        }
    }
    else {
        // Modo CREAR
        if (title)
            title.innerText = 'Crear Nueva Materia';
        if (submitBtn)
            submitBtn.innerText = 'Crear Materia';
    }
    modal.classList.add('active');
}
function closeSubjectModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) {
        modal.classList.remove('active');
    }
}
function attachGlobalListeners() {
    const addBtn = document.getElementById('addSubjectBtn');
    const closeModalBtn = document.getElementById('closeSubjectModalBtn');
    const cancelBtn = document.getElementById('cancelSubjectBtn');
    const subjectForm = document.getElementById('subjectForm');
    const emptyStateBtn = document.getElementById('emptyStateSubjectBtn');
    const modal = document.getElementById('subjectModal');
    // FIX para ERROR 2769: Usar función anónima para que el listener no pase el objeto Event 
    // a la función openSubjectModal, que espera un 'number | null'.
    if (addBtn)
        addBtn.addEventListener('click', () => openSubjectModal(null));
    if (emptyStateBtn)
        emptyStateBtn.addEventListener('click', () => openSubjectModal(null));
    if (closeModalBtn)
        closeModalBtn.addEventListener('click', closeSubjectModal);
    if (cancelBtn)
        cancelBtn.addEventListener('click', closeSubjectModal);
    if (subjectForm)
        subjectForm.addEventListener('submit', handleSaveSubject);
    // Cerrar modal al hacer click fuera
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal)
                closeSubjectModal();
        });
    }
}
window.addEventListener('DOMContentLoaded', () => {
    attachGlobalListeners();
    loadSubjects();
});
