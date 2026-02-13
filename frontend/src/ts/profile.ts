import { getCurrentUser, updateCurrentUser, uploadUserAvatar } from "./api.js";
import { getCurrentLanguage, setCurrentLanguage, applyTranslations, t, getTranslations, type Language } from "./i18n.js";
import { showConfirmModal, showAlertModal, initConfirmModal } from "./confirmModal.js";

async function showError(msg: string) {
    try {
        const el = document.getElementById('profileMsg');
        if (el) {
            el.textContent = msg;
            el.classList.remove('hidden');
        } else {
            alert(msg);
        }
    } catch (e) { console.error(msg); }
}

async function clearMessage() {
    try {
        const el = document.getElementById('profileMsg');
        if (el) { el.textContent = ''; el.classList.add('hidden'); }
    } catch(e){}
}

function setSwitchState(btn: HTMLElement | null, checked: boolean) {
    if (!btn) return;
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
        if (checked) span.classList.add('translate-x-5');
        else span.classList.remove('translate-x-5');
    }
}

function refreshLanguageSelectOptions(select: HTMLSelectElement | null) {
    if (!select) return;
    const current = select.value as Language;
    const trans = t();
    const codes: Language[] = ['es', 'en', 'zh', 'pt'];
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
    } else {
        select.value = getCurrentLanguage();
    }
    // Force repaint to avoid cached option label
    select.blur();
}

async function init() {
    // Initialize confirmation modal
    initConfirmModal();
    
    // Apply translations on page load
    applyTranslations();
    
    const nameInput = document.getElementById('name') as HTMLInputElement | null;
    const emailInput = document.getElementById('email') as HTMLInputElement | null;
    const avatarImg = document.getElementById('avatarImg') as HTMLImageElement | null;
    const changePhotoBtn = document.getElementById('changePhotoBtn') as HTMLButtonElement | null;
    const avatarInput = document.getElementById('avatarInput') as HTMLInputElement | null;
    const saveBtn = document.getElementById('saveProfileBtn') as HTMLButtonElement | null;
    const darkModeBtn = document.getElementById('dark-mode') as HTMLElement | null;
    const taskReminders = document.getElementById('task-reminders') as HTMLElement | null;
    const habitReminders = document.getElementById('habit-reminders') as HTMLElement | null;
    const progressUpdates = document.getElementById('progress-updates') as HTMLElement | null;
    const languageSelect = document.getElementById('language-select') as HTMLSelectElement | null;

    if (!nameInput || !emailInput || !avatarImg || !changePhotoBtn || !avatarInput || !saveBtn) {
        console.error('Profile page: missing DOM elements');
        return;
    }

    let currentUser: any = null;

    try {
        const user = await getCurrentUser();
        currentUser = user;
        // Sync language from backend preference if available
        const backendLang = (user as any).language || (user as any).preferences?.language;
        if (backendLang && backendLang !== getCurrentLanguage()) {
            setCurrentLanguage(backendLang as Language);
            applyTranslations();
        }
        if (languageSelect) {
            refreshLanguageSelectOptions(languageSelect);
            if (backendLang) languageSelect.value = backendLang;
        }
        // Populate fields defensively
        nameInput.value = (user.first_name || user.username || '') as string;
        emailInput.value = user.email || '';
        // Try common avatar fields
        const possibleAvatar = (user.avatar || user.photo || user.avatar_url || user.profile_image) as string | undefined;
        if (possibleAvatar) avatarImg.src = possibleAvatar;
        // Populate preference toggles if provided by API
        const prefs = (user as any).preferences || {};
        try {
            if (darkModeBtn && prefs.dark_mode) {
                darkModeBtn.setAttribute('data-state', 'checked');
                darkModeBtn.setAttribute('aria-checked', 'true');
                const span = darkModeBtn.querySelector('span'); if (span) span.classList.add('translate-x-5');
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
        } catch(e) { /* non-fatal */ }
    } catch (err: any) {
        console.error('Error loading user', err);
        const trans = t();
        await showError(trans.profile.loadUserError);
    }

    changePhotoBtn.addEventListener('click', () => avatarInput.click());

    avatarInput.addEventListener('change', async (e) => {
        const files = avatarInput.files;
        if (!files || files.length === 0) return;
        const file = files[0];
        saveBtn.disabled = true;
        try {
            const res = await uploadUserAvatar(file);
            // If server returns new avatar url, update image
            const newUrl = res?.avatar || res?.url || res?.avatar_url || res?.photo || res?.profile_image;
            if (newUrl && avatarImg) avatarImg.src = newUrl;
            await clearMessage();
            // small non-blocking confirmation
            const trans = t();
            const el = document.getElementById('profileMsg');
            if (el) { el.textContent = trans.profile.avatarUpdated; el.classList.remove('hidden'); setTimeout(()=>{ if (el) { el.classList.add('hidden'); el.textContent=''; } }, 3000); }
        } catch (err: any) {
            console.error('Upload avatar error', err);
            // Try to extract useful message
            const trans = t();
            let message = trans.profile.avatarUpdateError;
            try {
                if (err instanceof Error) message = err.message || message;
                else message = String(err);
            } catch {}
            // If the error contains HTTP response JSON, try to show it
            try {
                // If err is a Response-like object
                if (err && typeof err === 'object' && 'status' in err) {
                    message = `Error ${err.status}`;
                }
            } catch {}
            await showError(message);
        } finally {
            saveBtn.disabled = false;
        }
    });

    saveBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        const payload: any = {};
        if (nameInput.value) payload.first_name = nameInput.value;
        if (emailInput.value) payload.email = emailInput.value;
        // Always persist current language to backend
        payload.language = getCurrentLanguage();

        // preferences from toggles
        const prefs: any = {};
        if (darkModeBtn) prefs.dark_mode = darkModeBtn.getAttribute('data-state') === 'checked';
        if (taskReminders) prefs.task_reminders = taskReminders.getAttribute('data-state') === 'checked';
        if (habitReminders) prefs.habit_reminders = habitReminders.getAttribute('data-state') === 'checked';
        if (progressUpdates) prefs.progress_updates = progressUpdates.getAttribute('data-state') === 'checked';
        // Include current language in preferences
        prefs.language = getCurrentLanguage();

        if (Object.keys(prefs).length) payload.preferences = prefs;

        try {
            await updateCurrentUser(payload);
            const trans = t();
            await showAlertModal(trans.profile.profileUpdated, trans.common.success);
        } catch (err: any) {
            console.error('Error updating profile', err);
            const trans = t();
            await showError(trans.profile.profileUpdateError);
        } finally {
            saveBtn.disabled = false;
        }
    });

    // Small helper to toggle visual state on fake switches when clicked
    document.querySelectorAll('[role="switch"]').forEach(el => {
        el.addEventListener('click', (ev) => {
            const btn = ev.currentTarget as HTMLElement;
            const checked = btn.getAttribute('data-state') === 'checked';
            setSwitchState(btn, !checked);
        });
    });

    // Persist notification preference toggles immediately
    const notificationToggles: Array<{ el: HTMLElement | null; key: 'task_reminders' | 'habit_reminders' | 'progress_updates' }> = [
        { el: taskReminders, key: 'task_reminders' },
        { el: habitReminders, key: 'habit_reminders' },
        { el: progressUpdates, key: 'progress_updates' },
    ];
    notificationToggles.forEach(({ el, key }) => {
        if (!el) return;
        el.addEventListener('click', async () => {
            const nextValue = el.getAttribute('data-state') === 'checked';
            const previousValue = !nextValue;
            el.style.pointerEvents = 'none';
            try {
                const existingPrefs = (currentUser?.preferences || {}) as any;
                const prefs: any = { ...existingPrefs, [key]: nextValue };
                await updateCurrentUser({ preferences: prefs } as any);
                currentUser = { ...(currentUser || {}), preferences: prefs };
            } catch (err) {
                console.error(`Error saving ${key}:`, err);
                // Revert UI only when backend save fails
                setSwitchState(el, previousValue);
                const trans = t();
                await showError(trans.profile.profileUpdateError);
            } finally {
                el.style.pointerEvents = '';
            }
        });
    });

    // Handle language change
    if (languageSelect) {
        languageSelect.addEventListener('change', async (e) => {
            const newLang = (e.target as HTMLSelectElement).value as Language;
            const currentLang = getCurrentLanguage();
            
            // If language hasn't changed, do nothing
            if (newLang === currentLang) {
                return;
            }
            
            // Show confirmation modal
            const trans = t();
            const confirmed = await showConfirmModal(
                trans.confirmations.changeLanguageMessage,
                trans.confirmations.changeLanguage
            );
            
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
                const existingPrefs = (currentUser?.preferences || {}) as any;
                const prefs: any = { ...existingPrefs, language: newLang };
                await updateCurrentUser({ preferences: prefs, language: newLang } as any);
                currentUser = { ...currentUser, preferences: prefs, language: newLang };
            } catch (err) {
                console.error('Error saving language preference:', err);
                // Continue anyway - language is saved in localStorage
            }
            
            // Show success message
            const newTrans = getTranslations(newLang);
            await showAlertModal(
                newTrans.profile.languageChangeSuccess,
                newTrans.profile.languageChanged
            );
            
            // Reload page to apply all translations
            window.location.reload();
        });
        
        // Update option texts when language changes (for display)
        refreshLanguageSelectOptions(languageSelect);
    }
}

document.addEventListener('DOMContentLoaded', init);
