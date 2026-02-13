var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCurrentUser, updateCurrentUser, uploadUserAvatar } from "./api.js";
import { getCurrentLanguage, setCurrentLanguage, applyTranslations, t, getTranslations } from "./i18n.js";
import { showConfirmModal, showAlertModal, initConfirmModal } from "./confirmModal.js";
function showError(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const el = document.getElementById('profileMsg');
            if (el) {
                el.textContent = msg;
                el.classList.remove('hidden');
            }
            else {
                alert(msg);
            }
        }
        catch (e) {
            console.error(msg);
        }
    });
}
function clearMessage() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const el = document.getElementById('profileMsg');
            if (el) {
                el.textContent = '';
                el.classList.add('hidden');
            }
        }
        catch (e) { }
    });
}
function setSwitchState(btn, checked) {
    if (!btn)
        return;
    btn.setAttribute('data-state', checked ? 'checked' : 'unchecked');
    btn.setAttribute('aria-checked', checked ? 'true' : 'false');
    btn.style.background = checked
        ? 'linear-gradient(90deg, rgba(168,85,247,0.95), rgba(217,70,239,0.95))'
        : 'rgba(51,65,85,0.55)';
    btn.style.boxShadow = checked
        ? '0 0 0 1px rgba(168,85,247,0.45), 0 0 12px rgba(168,85,247,0.25)'
        : '0 0 0 1px rgba(148,163,184,0.25)';
    const span = btn.querySelector('span');
    if (span) {
        if (checked)
            span.classList.add('translate-x-5');
        else
            span.classList.remove('translate-x-5');
    }
}
function refreshLanguageSelectOptions(select) {
    if (!select)
        return;
    const current = select.value;
    const trans = t();
    const codes = ['es', 'en', 'zh', 'pt'];
    select.innerHTML = '';
    codes.forEach((code) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = trans.languages[code];
        opt.setAttribute('data-i18n', `languages.${code}`);
        select.appendChild(opt);
    });
    if (codes.includes(current)) {
        select.value = current;
    }
    else {
        select.value = getCurrentLanguage();
    }
    // Force repaint to avoid cached option label
    select.blur();
}
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // Initialize confirmation modal
        initConfirmModal();
        // Apply translations on page load
        applyTranslations();
        const nameInput = document.getElementById('name');
        const emailInput = document.getElementById('email');
        const avatarImg = document.getElementById('avatarImg');
        const changePhotoBtn = document.getElementById('changePhotoBtn');
        const avatarInput = document.getElementById('avatarInput');
        const saveBtn = document.getElementById('saveProfileBtn');
        const darkModeBtn = document.getElementById('dark-mode');
        const taskReminders = document.getElementById('task-reminders');
        const habitReminders = document.getElementById('habit-reminders');
        const progressUpdates = document.getElementById('progress-updates');
        const languageSelect = document.getElementById('language-select');
        if (!nameInput || !emailInput || !avatarImg || !changePhotoBtn || !avatarInput || !saveBtn) {
            console.error('Profile page: missing DOM elements');
            return;
        }
        let currentUser = null;
        try {
            const user = yield getCurrentUser();
            currentUser = user;
            // Sync language from backend preference if available
            const backendLang = user.language || ((_a = user.preferences) === null || _a === void 0 ? void 0 : _a.language);
            if (backendLang && backendLang !== getCurrentLanguage()) {
                setCurrentLanguage(backendLang);
                applyTranslations();
            }
            if (languageSelect) {
                refreshLanguageSelectOptions(languageSelect);
                if (backendLang)
                    languageSelect.value = backendLang;
            }
            // Populate fields defensively
            nameInput.value = (user.first_name || user.username || '');
            emailInput.value = user.email || '';
            // Try common avatar fields
            const possibleAvatar = (user.avatar || user.photo || user.avatar_url || user.profile_image);
            if (possibleAvatar)
                avatarImg.src = possibleAvatar;
            // Populate preference toggles if provided by API
            const prefs = user.preferences || {};
            try {
                if (darkModeBtn && prefs.dark_mode) {
                    darkModeBtn.setAttribute('data-state', 'checked');
                    darkModeBtn.setAttribute('aria-checked', 'true');
                    const span = darkModeBtn.querySelector('span');
                    if (span)
                        span.classList.add('translate-x-5');
                }
                // Notification preferences: enabled by default when backend value is missing
                const taskEnabled = prefs.task_reminders !== false;
                const habitEnabled = prefs.habit_reminders !== false;
                const progressEnabled = prefs.progress_updates !== false;
                setSwitchState(taskReminders, taskEnabled);
                setSwitchState(habitReminders, habitEnabled);
                setSwitchState(progressUpdates, progressEnabled);
                // Set language from preferences or localStorage
                const savedLanguage = prefs.language || getCurrentLanguage();
                if (languageSelect) {
                    languageSelect.value = savedLanguage;
                    refreshLanguageSelectOptions(languageSelect);
                }
            }
            catch (e) { /* non-fatal */ }
        }
        catch (err) {
            console.error('Error loading user', err);
            const trans = t();
            yield showError(trans.profile.loadUserError);
        }
        changePhotoBtn.addEventListener('click', () => avatarInput.click());
        avatarInput.addEventListener('change', (e) => __awaiter(this, void 0, void 0, function* () {
            const files = avatarInput.files;
            if (!files || files.length === 0)
                return;
            const file = files[0];
            saveBtn.disabled = true;
            try {
                const res = yield uploadUserAvatar(file);
                // If server returns new avatar url, update image
                const newUrl = (res === null || res === void 0 ? void 0 : res.avatar) || (res === null || res === void 0 ? void 0 : res.url) || (res === null || res === void 0 ? void 0 : res.avatar_url) || (res === null || res === void 0 ? void 0 : res.photo) || (res === null || res === void 0 ? void 0 : res.profile_image);
                if (newUrl && avatarImg)
                    avatarImg.src = newUrl;
                yield clearMessage();
                // small non-blocking confirmation
                const trans = t();
                const el = document.getElementById('profileMsg');
                if (el) {
                    el.textContent = trans.profile.avatarUpdated;
                    el.classList.remove('hidden');
                    setTimeout(() => { if (el) {
                        el.classList.add('hidden');
                        el.textContent = '';
                    } }, 3000);
                }
            }
            catch (err) {
                console.error('Upload avatar error', err);
                // Try to extract useful message
                const trans = t();
                let message = trans.profile.avatarUpdateError;
                try {
                    if (err instanceof Error)
                        message = err.message || message;
                    else
                        message = String(err);
                }
                catch (_a) { }
                // If the error contains HTTP response JSON, try to show it
                try {
                    // If err is a Response-like object
                    if (err && typeof err === 'object' && 'status' in err) {
                        message = `Error ${err.status}`;
                    }
                }
                catch (_b) { }
                yield showError(message);
            }
            finally {
                saveBtn.disabled = false;
            }
        }));
        saveBtn.addEventListener('click', (e) => __awaiter(this, void 0, void 0, function* () {
            e.preventDefault();
            saveBtn.disabled = true;
            const payload = {};
            if (nameInput.value)
                payload.first_name = nameInput.value;
            if (emailInput.value)
                payload.email = emailInput.value;
            // Always persist current language to backend
            payload.language = getCurrentLanguage();
            // preferences from toggles
            const prefs = {};
            if (darkModeBtn)
                prefs.dark_mode = darkModeBtn.getAttribute('data-state') === 'checked';
            if (taskReminders)
                prefs.task_reminders = taskReminders.getAttribute('data-state') === 'checked';
            if (habitReminders)
                prefs.habit_reminders = habitReminders.getAttribute('data-state') === 'checked';
            if (progressUpdates)
                prefs.progress_updates = progressUpdates.getAttribute('data-state') === 'checked';
            // Include current language in preferences
            prefs.language = getCurrentLanguage();
            if (Object.keys(prefs).length)
                payload.preferences = prefs;
            try {
                yield updateCurrentUser(payload);
                const trans = t();
                yield showAlertModal(trans.profile.profileUpdated, trans.common.success);
            }
            catch (err) {
                console.error('Error updating profile', err);
                const trans = t();
                yield showError(trans.profile.profileUpdateError);
            }
            finally {
                saveBtn.disabled = false;
            }
        }));
        // Small helper to toggle visual state on fake switches when clicked
        document.querySelectorAll('[role="switch"]').forEach(el => {
            el.addEventListener('click', (ev) => {
                const btn = ev.currentTarget;
                const checked = btn.getAttribute('data-state') === 'checked';
                setSwitchState(btn, !checked);
            });
        });
        // Persist notification preference toggles immediately
        const notificationToggles = [
            { el: taskReminders, key: 'task_reminders' },
            { el: habitReminders, key: 'habit_reminders' },
            { el: progressUpdates, key: 'progress_updates' },
        ];
        notificationToggles.forEach(({ el, key }) => {
            if (!el)
                return;
            el.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                const nextValue = el.getAttribute('data-state') === 'checked';
                const previousValue = !nextValue;
                el.style.pointerEvents = 'none';
                try {
                    const existingPrefs = ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.preferences) || {});
                    const prefs = Object.assign(Object.assign({}, existingPrefs), { [key]: nextValue });
                    yield updateCurrentUser({ preferences: prefs });
                    currentUser = Object.assign(Object.assign({}, (currentUser || {})), { preferences: prefs });
                }
                catch (err) {
                    console.error(`Error saving ${key}:`, err);
                    // Revert UI only when backend save fails
                    setSwitchState(el, previousValue);
                    const trans = t();
                    yield showError(trans.profile.profileUpdateError);
                }
                finally {
                    el.style.pointerEvents = '';
                }
            }));
        });
        // Handle language change
        if (languageSelect) {
            languageSelect.addEventListener('change', (e) => __awaiter(this, void 0, void 0, function* () {
                const newLang = e.target.value;
                const currentLang = getCurrentLanguage();
                // If language hasn't changed, do nothing
                if (newLang === currentLang) {
                    return;
                }
                // Show confirmation modal
                const trans = t();
                const confirmed = yield showConfirmModal(trans.confirmations.changeLanguageMessage, trans.confirmations.changeLanguage);
                if (!confirmed) {
                    // Revert selection if cancelled
                    languageSelect.value = currentLang;
                    return;
                }
                // Change language
                setCurrentLanguage(newLang);
                applyTranslations();
                refreshLanguageSelectOptions(languageSelect);
                // Save to backend preferences
                try {
                    const existingPrefs = ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.preferences) || {});
                    const prefs = Object.assign(Object.assign({}, existingPrefs), { language: newLang });
                    yield updateCurrentUser({ preferences: prefs, language: newLang });
                    currentUser = Object.assign(Object.assign({}, currentUser), { preferences: prefs, language: newLang });
                }
                catch (err) {
                    console.error('Error saving language preference:', err);
                    // Continue anyway - language is saved in localStorage
                }
                // Show success message
                const newTrans = getTranslations(newLang);
                yield showAlertModal(newTrans.profile.languageChangeSuccess, newTrans.profile.languageChanged);
                // Reload page to apply all translations
                window.location.reload();
            }));
            // Update option texts when language changes (for display)
            refreshLanguageSelectOptions(languageSelect);
        }
    });
}
document.addEventListener('DOMContentLoaded', init);
