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
function init() {
    return __awaiter(this, void 0, void 0, function* () {
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
        if (!nameInput || !emailInput || !avatarImg || !changePhotoBtn || !avatarInput || !saveBtn) {
            console.error('Profile page: missing DOM elements');
            return;
        }
        try {
            const user = yield getCurrentUser();
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
                if (taskReminders && prefs.task_reminders) {
                    taskReminders.setAttribute('data-state', 'checked');
                    taskReminders.setAttribute('aria-checked', 'true');
                    const span = taskReminders.querySelector('span');
                    if (span)
                        span.classList.add('translate-x-5');
                }
                if (habitReminders && prefs.habit_reminders) {
                    habitReminders.setAttribute('data-state', 'checked');
                    habitReminders.setAttribute('aria-checked', 'true');
                    const span = habitReminders.querySelector('span');
                    if (span)
                        span.classList.add('translate-x-5');
                }
                if (progressUpdates && prefs.progress_updates) {
                    progressUpdates.setAttribute('data-state', 'checked');
                    progressUpdates.setAttribute('aria-checked', 'true');
                    const span = progressUpdates.querySelector('span');
                    if (span)
                        span.classList.add('translate-x-5');
                }
            }
            catch (e) { /* non-fatal */ }
        }
        catch (err) {
            console.error('Error loading user', err);
            yield showError('No se pudo cargar la información del usuario.');
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
                const el = document.getElementById('profileMsg');
                if (el) {
                    el.textContent = 'Foto de perfil actualizada.';
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
                let message = 'No se pudo subir la foto.';
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
            if (Object.keys(prefs).length)
                payload.preferences = prefs;
            try {
                yield updateCurrentUser(payload);
                alert('Perfil actualizado correctamente');
            }
            catch (err) {
                console.error('Error updating profile', err);
                yield showError('No se pudieron guardar los cambios.');
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
                btn.setAttribute('data-state', checked ? 'unchecked' : 'checked');
                btn.setAttribute('aria-checked', checked ? 'false' : 'true');
                // Move inner knob if present
                const span = btn.querySelector('span');
                if (span) {
                    if (checked)
                        span.classList.remove('translate-x-5');
                    else
                        span.classList.add('translate-x-5');
                }
            });
        });
    });
}
document.addEventListener('DOMContentLoaded', init);
