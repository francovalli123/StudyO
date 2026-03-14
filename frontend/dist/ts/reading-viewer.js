var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiGet, apiPatch, BASE_URL, getToken } from "./api.js";
let bookId = null;
let book = null;
let pdfDoc = null;
let currentPage = 1;
let lastSavedPage = 0;
let lastSavedAt = 0;
let saveTimer = null;
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
const pdfCanvas = document.getElementById("pdfCanvas");
const pdfContainer = document.getElementById("pdfContainer");
function getBookIdFromUrl() {
    const pathMatch = window.location.pathname.match(/\/reading\/viewer\/(\d+)/);
    if (pathMatch && pathMatch[1]) {
        return Number(pathMatch[1]);
    }
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("book_id");
    return queryId ? Number(queryId) : null;
}
function loadBook() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bookId)
            return;
        const loaded = yield apiGet(`/books/${bookId}/`);
        book = loaded;
        if (bookTitleEl)
            bookTitleEl.textContent = loaded.title;
        if (bookMetaEl) {
            const subjectName = loaded.subject ? loaded.subject.name : "Sin materia";
            bookMetaEl.textContent = `${loaded.author} · ${subjectName}`;
        }
        if (completionBadge) {
            completionBadge.classList.toggle("hidden", !loaded.completed);
        }
        if (totalPagesEl)
            totalPagesEl.textContent = String(loaded.total_pages);
        currentPage = Math.max(1, Math.min(loaded.last_page_read || 1, loaded.total_pages));
        lastSavedPage = loaded.last_page_read || 0;
        updateProgressUI();
    });
}
function updateProgressUI() {
    if (!book)
        return;
    if (currentPageEl)
        currentPageEl.textContent = String(currentPage);
    if (totalPagesEl)
        totalPagesEl.textContent = String(book.total_pages);
    const percent = Math.round((Math.min(currentPage, book.total_pages) / book.total_pages) * 100);
    if (progressLabel)
        progressLabel.textContent = `${percent}%`;
    if (completionBadge) {
        completionBadge.classList.toggle("hidden", currentPage < book.total_pages);
    }
}
function resolveFileUrl(raw) {
    if (!raw)
        return null;
    if (raw.startsWith("http://") || raw.startsWith("https://"))
        return raw;
    const apiRoot = BASE_URL.replace(/\/api$/, "");
    if (raw.startsWith("/"))
        return `${apiRoot}${raw}`;
    return `${apiRoot}/${raw}`;
}
function renderPage(pageNumber) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!pdfDoc || !pdfCanvas || renderInProgress)
            return;
        renderInProgress = true;
        try {
            const page = yield pdfDoc.getPage(pageNumber);
            const containerWidth = pdfContainer ? pdfContainer.clientWidth : window.innerWidth;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const scale = Math.max(0.6, Math.min(1.6, (containerWidth - 32) / unscaledViewport.width));
            const viewport = page.getViewport({ scale });
            const context = pdfCanvas.getContext("2d");
            if (!context)
                return;
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;
            yield page.render({ canvasContext: context, viewport }).promise;
            updateProgressUI();
        }
        finally {
            renderInProgress = false;
        }
    });
}
function loadPdf() {
    return __awaiter(this, void 0, void 0, function* () {
        const resolved = resolveFileUrl((book === null || book === void 0 ? void 0 : book.file_url) || (book === null || book === void 0 ? void 0 : book.file));
        const token = getToken();
        const protectedUrl = bookId ? `${BASE_URL}/books/${bookId}/file/` : null;
        const useProtected = !!token && !!protectedUrl;
        const fileUrl = useProtected ? protectedUrl : resolved;
        if (!fileUrl)
            return;
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        if (useProtected) {
            pdfDoc = yield pdfjsLib.getDocument({
                url: fileUrl,
                httpHeaders: { Authorization: `Token ${token}` },
            }).promise;
        }
        else {
            pdfDoc = yield pdfjsLib.getDocument(fileUrl).promise;
        }
        if (totalPagesEl)
            totalPagesEl.textContent = String(pdfDoc.numPages);
        yield renderPage(currentPage);
    });
}
function updatePage(delta) {
    if (!book)
        return;
    const nextPage = Math.min(Math.max(1, currentPage + delta), book.total_pages);
    if (nextPage === currentPage)
        return;
    currentPage = nextPage;
    renderPage(currentPage);
    maybeSaveProgress();
}
function maybeSaveProgress(force = false) {
    if (!bookId || !book)
        return;
    const now = Date.now();
    const pageDelta = Math.abs(currentPage - lastSavedPage);
    const timeDelta = now - lastSavedAt;
    if (!force && pageDelta < 5 && timeDelta < 20000) {
        return;
    }
    saveProgress();
}
function saveProgress() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!bookId)
            return;
        try {
            yield apiPatch(`/books/${bookId}/progress/`, {
                last_page_read: currentPage,
            });
            lastSavedPage = currentPage;
            lastSavedAt = Date.now();
            if (lastSavedAtEl) {
                const dt = new Date(lastSavedAt);
                lastSavedAtEl.textContent = dt.toLocaleTimeString();
            }
        }
        catch (error) {
            console.error("Error saving progress:", error);
        }
    });
}
function setupAutosave() {
    if (saveTimer)
        window.clearInterval(saveTimer);
    saveTimer = window.setInterval(() => {
        maybeSaveProgress(true);
    }, 20000);
}
function setupBeforeUnload() {
    window.addEventListener("beforeunload", () => {
        if (!bookId)
            return;
        const token = getToken();
        if (!token)
            return;
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
    if (prevBtn)
        prevBtn.addEventListener("click", () => updatePage(-1));
    if (nextBtn)
        nextBtn.addEventListener("click", () => updatePage(1));
    window.addEventListener("resize", () => renderPage(currentPage));
}
window.addEventListener("DOMContentLoaded", () => __awaiter(void 0, void 0, void 0, function* () {
    bookId = getBookIdFromUrl();
    if (!bookId) {
        if (bookTitleEl)
            bookTitleEl.textContent = "Libro no encontrado";
        if (bookMetaEl)
            bookMetaEl.textContent = "No se pudo determinar el ID del libro.";
        return;
    }
    try {
        yield loadBook();
        yield loadPdf();
        attachHandlers();
        setupAutosave();
        setupBeforeUnload();
    }
    catch (error) {
        console.error("Error loading reader:", error);
        if (bookMetaEl)
            bookMetaEl.textContent = "No se pudo cargar el PDF.";
    }
}));
