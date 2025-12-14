/**
 * Confirmation Modal Utility
 * Provides a professional confirmation dialog that can be used throughout the app
 */
let confirmModalContainer = null;
let confirmResolve = null;
/**
 * Initialize the confirmation modal (call this once on page load)
 */
export function initConfirmModal() {
    // Create modal HTML if it doesn't exist
    if (!document.getElementById('confirmModal')) {
        const modalHTML = `
            <div id="confirmModal" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" style="display: none;">
                <div class="bg-dark-card border border-gray-800 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl shadow-purple-900/20">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                            <i data-lucide="alert-triangle" class="w-6 h-6 text-red-400"></i>
                        </div>
                        <h3 id="confirmModalTitle" class="text-xl font-bold text-white">Confirmar acción</h3>
                    </div>
                    <p id="confirmModalMessage" class="text-gray-300 mb-6">¿Estás seguro de que deseas realizar esta acción?</p>
                    <div class="flex gap-3">
                        <button id="confirmModalCancel" class="flex-1 px-4 py-2.5 rounded-xl bg-transparent border border-gray-700 text-gray-300 text-sm font-medium hover:bg-gray-800 transition-all">
                            Cancelar
                        </button>
                        <button id="confirmModalConfirm" class="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-[1.02]">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }
    confirmModalContainer = document.getElementById('confirmModal');
    const cancelBtn = document.getElementById('confirmModalCancel');
    const confirmBtn = document.getElementById('confirmModalConfirm');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeConfirmModal(false);
        });
    }
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            closeConfirmModal(true);
        });
    }
    // Close on overlay click
    if (confirmModalContainer) {
        confirmModalContainer.addEventListener('click', (e) => {
            if (e.target === confirmModalContainer) {
                closeConfirmModal(false);
            }
        });
    }
    if (typeof lucide !== 'undefined')
        lucide.createIcons();
}
/**
 * Show alert modal (for errors/info, not confirmation)
 * @param message - The message to display
 * @param title - Optional title (defaults to "Información")
 */
export function showAlertModal(message, title = 'Información') {
    return new Promise((resolve) => {
        if (!confirmModalContainer) {
            initConfirmModal();
            confirmModalContainer = document.getElementById('confirmModal');
        }
        if (!confirmModalContainer) {
            resolve();
            return;
        }
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        const confirmBtn = document.getElementById('confirmModalConfirm');
        const cancelBtn = document.getElementById('confirmModalCancel');
        if (titleEl)
            titleEl.textContent = title;
        if (messageEl)
            messageEl.textContent = message;
        // Change button text and style for alert
        if (confirmBtn) {
            confirmBtn.textContent = 'Aceptar';
            confirmBtn.className = 'flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all transform hover:scale-[1.02]';
        }
        if (cancelBtn) {
            cancelBtn.style.display = 'none';
        }
        const handleConfirm = () => {
            if (confirmBtn)
                confirmBtn.removeEventListener('click', handleConfirm);
            if (cancelBtn) {
                cancelBtn.style.display = 'block';
                cancelBtn.textContent = 'Cancelar';
            }
            if (confirmBtn) {
                confirmBtn.textContent = 'Confirmar';
                confirmBtn.className = 'flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all transform hover:scale-[1.02]';
            }
            closeConfirmModal(false);
            resolve();
        };
        if (confirmBtn) {
            confirmBtn.addEventListener('click', handleConfirm, { once: true });
        }
        confirmModalContainer.style.display = 'flex';
        if (typeof lucide !== 'undefined')
            lucide.createIcons();
    });
}
/**
 * Show confirmation modal
 * @param message - The message to display
 * @param title - Optional title (defaults to "Confirmar acción")
 * @returns Promise that resolves to true if confirmed, false if cancelled
 */
export function showConfirmModal(message, title = 'Confirmar acción') {
    return new Promise((resolve) => {
        if (!confirmModalContainer) {
            initConfirmModal();
            confirmModalContainer = document.getElementById('confirmModal');
        }
        if (!confirmModalContainer) {
            resolve(false);
            return;
        }
        const titleEl = document.getElementById('confirmModalTitle');
        const messageEl = document.getElementById('confirmModalMessage');
        if (titleEl)
            titleEl.textContent = title;
        if (messageEl)
            messageEl.textContent = message;
        confirmResolve = resolve;
        confirmModalContainer.style.display = 'flex';
        if (typeof lucide !== 'undefined')
            lucide.createIcons();
    });
}
/**
 * Close the confirmation modal
 */
function closeConfirmModal(confirmed) {
    if (confirmModalContainer) {
        confirmModalContainer.style.display = 'none';
    }
    if (confirmResolve) {
        confirmResolve(confirmed);
        confirmResolve = null;
    }
}
