import { apiGet, apiPatch, BASE_URL, getToken } from "./api.js";

declare const pdfjsLib: any;

interface BookDetail {
    id: number;
    title: string;
    author: string;
    subject: { id: number; name: string } | null;
    total_pages: number;
    last_page_read: number;
    progress: number;
    completed: boolean;
    file: string;
    file_url?: string | null;
}

let bookId: number | null = null;
let book: BookDetail | null = null;
let pdfDoc: any = null;
let currentPage = 1;
let lastSavedPage = 0;
let lastSavedAt = 0;
let saveTimer: number | null = null;
let renderInProgress = false;

const prevBtn = document.getElementById("prevPageBtn");
const nextBtn = document.getElementById("nextPageBtn");
const currentPageEl = document.getElementById("currentPage");
const totalPagesEl = document.getElementById("totalPages");
const bookTitleEl = document.getElementById("bookTitle");
const bookMetaEl = document.getElementById("bookMeta");
const completionBadge = document.getElementById("completionBadge");
const progressLabel = document.getElementById("progressLabel");
const lastSavedAtEl = document.getElementById("lastSavedAt");
const pdfCanvas = document.getElementById("pdfCanvas") as HTMLCanvasElement | null;
const pdfContainer = document.getElementById("pdfContainer");

function getBookIdFromUrl(): number | null {
    const pathMatch = window.location.pathname.match(/\/reading\/viewer\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
        return Number(pathMatch[1]);
    }
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("book_id");
    return queryId ? Number(queryId) : null;
}

async function loadBook() {
    if (!bookId) return;
    const loaded = await apiGet<BookDetail>(`/books/${bookId}/`);
    book = loaded;
    if (bookTitleEl) bookTitleEl.textContent = loaded.title;
    if (bookMetaEl) {
        const subjectName = loaded.subject ? loaded.subject.name : "Sin materia";
        bookMetaEl.textContent = `${loaded.author} ? ${subjectName}`;
    }
    if (completionBadge) {
        completionBadge.classList.toggle("hidden", !loaded.completed);
    }
    if (totalPagesEl) totalPagesEl.textContent = String(loaded.total_pages);
    currentPage = Math.max(1, Math.min(loaded.last_page_read || 1, loaded.total_pages));
    lastSavedPage = loaded.last_page_read || 0;
    updateProgressUI();
}


function updateProgressUI() {
    if (!book) return;
    if (currentPageEl) currentPageEl.textContent = String(currentPage);
    if (totalPagesEl) totalPagesEl.textContent = String(book.total_pages);
    const percent = Math.round((Math.min(currentPage, book.total_pages) / book.total_pages) * 100);
    if (progressLabel) progressLabel.textContent = `${percent}%`;
    if (completionBadge) {
        completionBadge.classList.toggle("hidden", currentPage < book.total_pages);
    }
}

function resolveFileUrl(raw?: string | null): string | null {
    if (!raw) return null;
    if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
    const apiRoot = BASE_URL.replace(/\/api$/, "");
    if (raw.startsWith("/")) return `${apiRoot}${raw}`;
    return `${apiRoot}/${raw}`;
}

async function renderPage(pageNumber: number) {
    if (!pdfDoc || !pdfCanvas || renderInProgress) return;
    renderInProgress = true;

    try {
        const page = await pdfDoc.getPage(pageNumber);
        const containerWidth = pdfContainer ? pdfContainer.clientWidth : window.innerWidth;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.max(0.6, Math.min(1.6, (containerWidth - 32) / unscaledViewport.width));
        const viewport = page.getViewport({ scale });
        const context = pdfCanvas.getContext("2d");
        if (!context) return;
        pdfCanvas.height = viewport.height;
        pdfCanvas.width = viewport.width;
        await page.render({ canvasContext: context, viewport }).promise;
        updateProgressUI();
    } finally {
        renderInProgress = false;
    }
}

async function loadPdf() {
    const fileUrl = resolveFileUrl(book?.file_url || book?.file);
    if (!fileUrl) return;
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
    pdfDoc = await pdfjsLib.getDocument(fileUrl).promise;
    if (totalPagesEl) totalPagesEl.textContent = String(pdfDoc.numPages);
    await renderPage(currentPage);
}

function updatePage(delta: number) {
    if (!book) return;
    const nextPage = Math.min(Math.max(1, currentPage + delta), book.total_pages);
    if (nextPage === currentPage) return;
    currentPage = nextPage;
    renderPage(currentPage);
    maybeSaveProgress();
}

function maybeSaveProgress(force: boolean = false) {
    if (!bookId || !book) return;
    const now = Date.now();
    const pageDelta = Math.abs(currentPage - lastSavedPage);
    const timeDelta = now - lastSavedAt;

    if (!force && pageDelta < 5 && timeDelta < 20000) {
        return;
    }

    saveProgress();
}

async function saveProgress() {
    if (!bookId) return;
    try {
        await apiPatch(`/books/${bookId}/progress/`, {
            last_page_read: currentPage,
        });
        lastSavedPage = currentPage;
        lastSavedAt = Date.now();
        if (lastSavedAtEl) {
            const dt = new Date(lastSavedAt);
            lastSavedAtEl.textContent = dt.toLocaleTimeString();
        }
    } catch (error) {
        console.error("Error saving progress:", error);
    }
}

function setupAutosave() {
    if (saveTimer) window.clearInterval(saveTimer);
    saveTimer = window.setInterval(() => {
        maybeSaveProgress(true);
    }, 20000);
}

function setupBeforeUnload() {
    window.addEventListener("beforeunload", () => {
        if (!bookId) return;
        const token = getToken();
        if (!token) return;
        const payload = JSON.stringify({ last_page_read: currentPage });
        fetch(`${BASE_URL}/books/${bookId}/progress/`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`,
            },
            body: payload,
            keepalive: true,
            credentials: "include",
        });
    });
}

function attachHandlers() {
    if (prevBtn) prevBtn.addEventListener("click", () => updatePage(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => updatePage(1));
    window.addEventListener("resize", () => renderPage(currentPage));
}

window.addEventListener("DOMContentLoaded", async () => {
    bookId = getBookIdFromUrl();
    if (!bookId) {
        if (bookTitleEl) bookTitleEl.textContent = "Libro no encontrado";
        if (bookMetaEl) bookMetaEl.textContent = "No se pudo determinar el ID del libro.";
        return;
    }

    try {
        await loadBook();
        await loadPdf();
        attachHandlers();
        setupAutosave();
        setupBeforeUnload();
    } catch (error) {
        console.error("Error loading reader:", error);
        if (bookMetaEl) bookMetaEl.textContent = "No se pudo cargar el PDF.";
    }
});
