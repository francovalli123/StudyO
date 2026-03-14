var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiDelete, apiGet, apiPost, apiPatch } from "./api.js";
import { initConfirmModal, showConfirmModal, showAlertModal } from "./confirmModal.js";
import { t } from "./i18n.js";
let subjects = [];
let books = [];
const addBookBtn = document.getElementById("addBookBtn");
const emptyStateAddBtn = document.getElementById("emptyStateAddBtn");
const bookModal = document.getElementById("bookModal");
const closeBookModalBtn = document.getElementById("closeBookModalBtn");
const cancelBookBtn = document.getElementById("cancelBookBtn");
const bookForm = document.getElementById("bookForm");
const booksGrid = document.getElementById("booksGrid");
const emptyState = document.getElementById("emptyState");
const bookSubject = document.getElementById("bookSubject");
const progressModal = document.getElementById("progressModal");
const closeProgressModalBtn = document.getElementById("closeProgressModalBtn");
const cancelProgressBtn = document.getElementById("cancelProgressBtn");
const progressForm = document.getElementById("progressForm");
const progressLastPage = document.getElementById("progressLastPage");
const progressNote = document.getElementById("progressNote");
const progressTotalPagesHint = document.getElementById("progressTotalPagesHint");
const saveProgressBtnText = document.getElementById("saveProgressBtnText");
const progressNoteCount = document.getElementById("progressNoteCount");
let selectedBookId = null;
const NOTE_MAX_LENGTH = 200;
function openBookModal() {
    if (!bookModal || !bookForm)
        return;
    bookForm.reset();
    bookModal.classList.add("active");
}
function closeBookModal() {
    if (!bookModal)
        return;
    bookModal.classList.remove("active");
}
function loadSubjects() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            subjects = yield apiGet("/subjects/");
            if (!bookSubject)
                return;
            bookSubject.innerHTML = `<option value="">Selecciona una materia</option>`;
            subjects.forEach((subject) => {
                const option = document.createElement("option");
                option.value = String(subject.id);
                option.textContent = subject.name;
                bookSubject.appendChild(option);
            });
        }
        catch (error) {
            console.error("Error loading subjects:", error);
        }
    });
}
function loadBooks() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            books = yield apiGet("/books/");
            renderBooks();
        }
        catch (error) {
            console.error("Error loading books:", error);
            if (booksGrid) {
                booksGrid.innerHTML = `<p class="text-red-400 col-span-full">Error loading books</p>`;
            }
        }
    });
}
function renderBooks() {
    if (!booksGrid || !emptyState)
        return;
    const tr = t();
    const reading = tr.reading || {};
    if (books.length === 0) {
        booksGrid.innerHTML = "";
        booksGrid.classList.add("hidden");
        emptyState.classList.remove("hidden");
        return;
    }
    emptyState.classList.add("hidden");
    booksGrid.classList.remove("hidden");
    booksGrid.innerHTML = books
        .map((book) => {
        const percent = Math.round((book.progress || 0) * 100);
        const subjectName = book.subject ? book.subject.name : (reading.noSubject || "Sin materia");
        const noteLabel = reading.lastNoteLabel || "Última nota";
        const note = book.note ? `<p class="text-xs text-gray-400 mt-3">${noteLabel}: ${book.note}</p>` : "";
        const completedBadge = book.completed
            ? `<span class="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-green-500/15 text-green-300">${reading.completed || "Completado"}</span>`
            : "";
        return `
                <div class="bg-dark-card rounded-2xl p-6 relative group" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.2), 0 0 30px rgba(168,85,247,0.15), inset 0 0 20px rgba(168,85,247,0.03);">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-start gap-3">
                            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/30 via-fuchsia-500/30 to-purple-500/30 flex items-center justify-center flex-shrink-0" style="box-shadow: 0 0 0 1px rgba(168,85,247,0.3);">
                                <i data-lucide="book" class="w-5 h-5 text-purple-400"></i>
                            </div>
                            <div class="flex-1">
                                <h3 class="text-xl font-bold text-white">${book.title}</h3>
                                <p class="text-sm text-gray-400 mt-1">${book.author}</p>
                                <p class="text-xs text-gray-500 mt-1">${subjectName}</p>
                            </div>
                        </div>
                        ${completedBadge}
                    </div>

                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-xs text-gray-400">${reading.progressLabel || "Progreso"}</span>
                            <span class="text-sm font-bold text-purple-400">${percent}%</span>
                        </div>
                        <div class="text-xs text-gray-400 mb-2">${book.last_page_read} / ${book.total_pages} ${reading.pagesLabel || "páginas"}</div>
                        <div class="w-full h-2 rounded-full bg-gray-700/50" style="box-shadow: inset 0 0 10px rgba(0,0,0,0.3);">
                            <div class="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300" style="width: ${percent}%; box-shadow: 0 0 15px rgba(168,85,247,0.6);"></div>
                        </div>
                        ${note}
                    </div>

                    <div class="flex gap-3 pt-4 border-t border-gray-700/50">
                        <button class="update-progress-btn flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-gray-700 text-gray-300 hover:text-white text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-book-id="${book.id}">
                            <i data-lucide="edit-3" class="w-4 h-4"></i>
                            <span>${reading.updateProgress || "Actualizar progreso"}</span>
                        </button>
                        <button class="delete-book-btn flex-1 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2" data-book-id="${book.id}">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                            <span>${reading.deleteBook || "Eliminar"}</span>
                        </button>
                    </div>
                </div>
            `;
    })
        .join("");
    if (typeof lucide !== "undefined")
        lucide.createIcons();
    attachBookEventListeners();
}
function attachBookEventListeners() {
    if (!booksGrid)
        return;
    booksGrid.addEventListener("click", (event) => __awaiter(this, void 0, void 0, function* () {
        const target = event.target;
        const deleteBtn = target.closest(".delete-book-btn");
        const updateBtn = target.closest(".update-progress-btn");
        if (deleteBtn) {
            const id = deleteBtn.dataset.bookId;
            if (!id)
                return;
            const confirmed = yield showConfirmModal("¿Eliminar este libro?", "Eliminar libro");
            if (!confirmed)
                return;
            yield deleteBook(Number(id));
            return;
        }
        if (updateBtn) {
            const id = updateBtn.dataset.bookId;
            if (!id)
                return;
            openProgressModal(Number(id));
        }
    }));
}
function deleteBook(bookId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield apiDelete(`/books/${bookId}/`);
            yield loadBooks();
        }
        catch (error) {
            console.error("Error deleting book:", error);
            const tr = t();
            const reading = tr.reading || {};
            yield showAlertModal(reading.deleteError || "No se pudo eliminar el libro.");
        }
    });
}
function handleBookSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        if (!bookForm)
            return;
        const submitBtn = bookForm.querySelector("button[type='submit']");
        const submitText = document.getElementById("submitBookBtnText");
        const tr = t();
        const reading = tr.reading || {};
        const originalText = submitText ? submitText.textContent : "";
        if (submitBtn)
            submitBtn.disabled = true;
        if (submitText)
            submitText.textContent = reading.uploading || "Subiendo...";
        try {
            const payload = new FormData(bookForm);
            const subjectValue = payload.get("subject");
            const totalPagesValue = payload.get("total_pages");
            if (!totalPagesValue) {
                yield showAlertModal(reading.totalPagesRequired || "Debes indicar el total de páginas.");
                return;
            }
            const totalPages = Number(totalPagesValue);
            if (!Number.isFinite(totalPages) || totalPages <= 0) {
                yield showAlertModal(reading.totalPagesInvalid || "El total de páginas debe ser mayor a 0.");
                return;
            }
            const data = {
                title: payload.get("title"),
                author: payload.get("author"),
                total_pages: totalPages,
            };
            if (subjectValue)
                data.subject = Number(subjectValue);
            yield apiPost("/books/", data, true);
            closeBookModal();
            yield loadBooks();
        }
        catch (error) {
            console.error("Error uploading book:", error);
            yield showAlertModal(reading.uploadError || "No se pudo crear el libro.");
        }
        finally {
            if (submitBtn)
                submitBtn.disabled = false;
            if (submitText)
                submitText.textContent = originalText || (reading.uploadBook || "Subir libro");
        }
    });
}
function openProgressModal(bookId) {
    if (!progressModal)
        return;
    const book = books.find((b) => b.id === bookId);
    if (!book)
        return;
    selectedBookId = bookId;
    if (progressLastPage)
        progressLastPage.value = String(book.last_page_read || 0);
    if (progressNote)
        progressNote.value = book.note || "";
    if (progressTotalPagesHint) {
        progressTotalPagesHint.textContent = `${book.total_pages} páginas totales`;
    }
    updateNoteCount();
    progressModal.classList.add("active");
}
function closeProgressModal() {
    if (!progressModal)
        return;
    progressModal.classList.remove("active");
    selectedBookId = null;
}
function updateNoteCount() {
    if (!progressNote || !progressNoteCount)
        return;
    const length = progressNote.value.length;
    progressNoteCount.textContent = `${length} / ${NOTE_MAX_LENGTH}`;
    if (length >= NOTE_MAX_LENGTH) {
        progressNoteCount.classList.add("text-red-400");
    }
    else {
        progressNoteCount.classList.remove("text-red-400");
    }
}
function handleProgressSubmit(event) {
    return __awaiter(this, void 0, void 0, function* () {
        event.preventDefault();
        if (!selectedBookId || !progressLastPage)
            return;
        const tr = t();
        const reading = tr.reading || {};
        const lastPage = Number(progressLastPage.value);
        if (!Number.isFinite(lastPage) || lastPage < 0) {
            yield showAlertModal(reading.lastPageInvalid || "La página debe ser 0 o más.");
            return;
        }
        const currentBook = books.find((b) => b.id === selectedBookId);
        if (!currentBook)
            return;
        if (lastPage > currentBook.total_pages) {
            yield showAlertModal(reading.lastPageExceed || "La página no puede superar el total.");
            return;
        }
        try {
            if (saveProgressBtnText)
                saveProgressBtnText.textContent = "Guardando...";
            const payload = {
                last_page_read: lastPage,
                note: progressNote ? progressNote.value.trim() : "",
            };
            yield apiPatch(`/books/${selectedBookId}/progress/`, payload);
            currentBook.last_page_read = payload.last_page_read;
            currentBook.note = payload.note || "";
            currentBook.completed = lastPage >= currentBook.total_pages;
            currentBook.progress = Math.min(lastPage, currentBook.total_pages) / currentBook.total_pages;
            renderBooks();
            closeProgressModal();
        }
        catch (error) {
            console.error("Error saving progress:", error);
            yield showAlertModal(reading.progressSaveError || "No se pudo guardar el progreso.");
        }
        finally {
            if (saveProgressBtnText)
                saveProgressBtnText.textContent = "Guardar";
        }
    });
}
function attachModalHandlers() {
    if (addBookBtn)
        addBookBtn.addEventListener("click", openBookModal);
    if (emptyStateAddBtn)
        emptyStateAddBtn.addEventListener("click", openBookModal);
    if (closeBookModalBtn)
        closeBookModalBtn.addEventListener("click", closeBookModal);
    if (cancelBookBtn)
        cancelBookBtn.addEventListener("click", closeBookModal);
    if (bookModal) {
        bookModal.addEventListener("click", (event) => {
            if (event.target === bookModal)
                closeBookModal();
        });
    }
    if (bookForm) {
        bookForm.addEventListener("submit", handleBookSubmit);
    }
    if (closeProgressModalBtn)
        closeProgressModalBtn.addEventListener("click", closeProgressModal);
    if (cancelProgressBtn)
        cancelProgressBtn.addEventListener("click", closeProgressModal);
    if (progressModal) {
        progressModal.addEventListener("click", (event) => {
            if (event.target === progressModal)
                closeProgressModal();
        });
    }
    if (progressForm) {
        progressForm.addEventListener("submit", handleProgressSubmit);
    }
    if (progressNote) {
        progressNote.addEventListener("input", updateNoteCount);
    }
}
window.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    initConfirmModal();
    attachModalHandlers();
    yield loadSubjects();
    yield loadBooks();
}));
