import { getCurrentUser, updateCurrentUser, uploadUserAvatar } from "./api.js";

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

async function init() {
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

    if (!nameInput || !emailInput || !avatarImg || !changePhotoBtn || !avatarInput || !saveBtn) {
        console.error('Profile page: missing DOM elements');
        return;
    }

    try {
        const user = await getCurrentUser();
        // Populate fields defensively
        nameInput.value = (user.first_name || user.username || '') as string;
        emailInput.value = user.email || '';
        // Try common avatar fields
        const possibleAvatar = (user.avatar || user.photo || user.avatar_url || user.profile_image) as string | undefined;
        if (possibleAvatar) avatarImg.src = possibleAvatar;
    } catch (err: any) {
        console.error('Error loading user', err);
        await showError('No se pudo cargar la información del usuario.');
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
            const el = document.getElementById('profileMsg');
            if (el) { el.textContent = 'Foto de perfil actualizada.'; el.classList.remove('hidden'); setTimeout(()=>{ if (el) { el.classList.add('hidden'); el.textContent=''; } }, 3000); }
        } catch (err: any) {
            console.error('Upload avatar error', err);
            // Try to extract useful message
            let message = 'No se pudo subir la foto.';
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

        // preferences from toggles
        const prefs: any = {};
        if (darkModeBtn) prefs.dark_mode = darkModeBtn.getAttribute('data-state') === 'checked';
        if (taskReminders) prefs.task_reminders = taskReminders.getAttribute('data-state') === 'checked';
        if (habitReminders) prefs.habit_reminders = habitReminders.getAttribute('data-state') === 'checked';
        if (progressUpdates) prefs.progress_updates = progressUpdates.getAttribute('data-state') === 'checked';

        if (Object.keys(prefs).length) payload.preferences = prefs;

        try {
            await updateCurrentUser(payload);
            alert('Perfil actualizado correctamente');
        } catch (err: any) {
            console.error('Error updating profile', err);
            await showError('No se pudieron guardar los cambios.');
        } finally {
            saveBtn.disabled = false;
        }
    });

    // Small helper to toggle visual state on fake switches when clicked
    document.querySelectorAll('[role="switch"]').forEach(el => {
        el.addEventListener('click', (ev) => {
            const btn = ev.currentTarget as HTMLElement;
            const checked = btn.getAttribute('data-state') === 'checked';
            btn.setAttribute('data-state', checked ? 'unchecked' : 'checked');
            btn.setAttribute('aria-checked', checked ? 'false' : 'true');
            // Move inner knob if present
            const span = btn.querySelector('span');
            if (span) {
                if (checked) span.classList.remove('translate-x-5'); else span.classList.add('translate-x-5');
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', init);
