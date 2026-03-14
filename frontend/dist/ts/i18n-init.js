/**
 * Auto-initialize i18n translations on page load
 * This script should be loaded in all HTML pages to automatically apply translations
 */
import { applyTranslations } from "./i18n.js";
/**
 * Initialize translations when DOM is ready
 */
function initI18n() {
    // Apply translations immediately
    applyTranslations();
    // Also apply after a short delay to catch dynamically loaded content
    setTimeout(() => {
        applyTranslations();
    }, 100);
    // Apply translations when language changes (via storage event)
    window.addEventListener('storage', (e) => {
        if (e.key === 'appLanguage') {
            applyTranslations();
        }
    });
}
// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
}
else {
    initI18n();
}
// Export for manual use if needed
export { initI18n };
