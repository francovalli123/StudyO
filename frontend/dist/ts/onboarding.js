var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { apiGet, getCurrentUser, updateCurrentUser } from './api.js';
const STORAGE_KEY = 'studyo_onboarding_context';
const STARTED_MARK_KEY = 'studyo_onboarding_started';
const EVENT_ONCE_PREFIX = 'studyo_onboarding_event_once_';
function emitOnce(eventKey, emitter, userId) {
    const scope = userId ? `${userId}_` : '';
    const key = `${EVENT_ONCE_PREFIX}${scope}${eventKey}`;
    if (localStorage.getItem(key) === '1')
        return;
    emitter();
    localStorage.setItem(key, '1');
}
function track(eventName, payload) {
    const detail = Object.assign(Object.assign({ event: eventName }, payload), { ts: Date.now() });
    try {
        document.dispatchEvent(new CustomEvent('analytics:event', { detail }));
    }
    catch (_) { }
    try {
        document.dispatchEvent(new CustomEvent('onboarding:event', { detail }));
    }
    catch (_) { }
}
function saveContext(ctx) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}
function loadContext() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
            return null;
        return JSON.parse(raw);
    }
    catch (_a) {
        return null;
    }
}
export function getOnboardingContext() {
    return loadContext();
}
export function shouldRunOnboarding(user, subjectsCount) {
    const step = user.onboarding_step || 'CREATE_SUBJECT';
    const finished = user.onboarding_completed === true || step === 'DONE' || step === 'SKIPPED';
    if (finished)
        return false;
    // CREATE_SUBJECT depends on having zero subjects; subsequent steps continue regardless.
    if (step === 'CREATE_SUBJECT')
        return subjectsCount === 0;
    return true;
}
export function storeOnboardingContext(user, subjectsCount) {
    const step = (user.onboarding_step || 'CREATE_SUBJECT');
    const active = shouldRunOnboarding(user, subjectsCount);
    const ctx = {
        active,
        step,
        hasSubjects: subjectsCount > 0,
        subjectsCount,
        updatedAt: Date.now(),
        userId: user.id,
    };
    saveContext(ctx);
    if (active && !sessionStorage.getItem(STARTED_MARK_KEY)) {
        sessionStorage.setItem(STARTED_MARK_KEY, '1');
        emitOnce('started', () => track('onboarding_started', { step }), user.id);
    }
    return ctx;
}
export function hydrateOnboardingContext() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const user = yield getCurrentUser();
            const subjects = yield apiGet('/subjects/');
            const count = Array.isArray(subjects) ? subjects.length : (user.subjects_count || 0);
            return storeOnboardingContext(user, count);
        }
        catch (_a) {
            return getOnboardingContext();
        }
    });
}
export function persistOnboardingStep(step) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const ctx = getOnboardingContext();
        if ((ctx === null || ctx === void 0 ? void 0 : ctx.step) === step)
            return;
        yield updateCurrentUser({ onboarding_step: step });
        const nextCtx = {
            active: step !== 'DONE' && step !== 'SKIPPED',
            step,
            hasSubjects: (_a = ctx === null || ctx === void 0 ? void 0 : ctx.hasSubjects) !== null && _a !== void 0 ? _a : false,
            subjectsCount: (_b = ctx === null || ctx === void 0 ? void 0 : ctx.subjectsCount) !== null && _b !== void 0 ? _b : 0,
            updatedAt: Date.now(),
            userId: (_c = ctx === null || ctx === void 0 ? void 0 : ctx.userId) !== null && _c !== void 0 ? _c : 0,
        };
        saveContext(nextCtx);
        emitOnce(`step_${step}`, () => track('onboarding_step_completed', { step }), nextCtx.userId);
    });
}
export function completeOnboarding() {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateCurrentUser({ onboarding_step: 'DONE', onboarding_completed: true });
        const ctx = getOnboardingContext();
        if (ctx) {
            ctx.active = false;
            ctx.step = 'DONE';
            ctx.updatedAt = Date.now();
            saveContext(ctx);
        }
        sessionStorage.removeItem(STARTED_MARK_KEY);
        emitOnce('completed', () => track('onboarding_completed', { step: 'DONE' }), ctx === null || ctx === void 0 ? void 0 : ctx.userId);
    });
}
export function skipOnboarding() {
    return __awaiter(this, void 0, void 0, function* () {
        yield updateCurrentUser({ onboarding_step: 'SKIPPED' });
        const ctx = getOnboardingContext() || {
            active: false,
            step: 'SKIPPED',
            hasSubjects: false,
            subjectsCount: 0,
            updatedAt: Date.now(),
            userId: 0,
        };
        ctx.active = false;
        ctx.step = 'SKIPPED';
        ctx.updatedAt = Date.now();
        saveContext(ctx);
        sessionStorage.removeItem(STARTED_MARK_KEY);
        emitOnce('skipped', () => track('onboarding_skipped', { step: 'SKIPPED' }), ctx.userId);
    });
}
export function onSubjectCreated() {
    return __awaiter(this, void 0, void 0, function* () {
        const ctx = getOnboardingContext();
        if (!ctx || !ctx.active || ctx.step !== 'CREATE_SUBJECT')
            return;
        yield persistOnboardingStep('CREATE_HABIT');
        const nextCtx = getOnboardingContext();
        if (nextCtx) {
            nextCtx.step = 'CREATE_HABIT';
            nextCtx.active = true;
            nextCtx.updatedAt = Date.now();
            saveContext(nextCtx);
        }
        showOnboardingOverlay({
            title: 'Paso 2: Creá un hábito',
            body: 'Ahora creá un hábito y revisá “Hábito clave”.',
            primaryText: 'Ir a hábitos',
            primaryHref: 'habits.html',
            lockClose: false,
            allowSkip: true,
            onSkip: () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield skipOnboarding();
                }
                catch (_) { }
                hideOnboardingOverlay();
            }),
        });
    });
}
export function syncOnboardingAcrossTabs(onChange) {
    window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY)
            return;
        onChange === null || onChange === void 0 ? void 0 : onChange(getOnboardingContext());
    });
}
export function showOnboardingOverlay(config) {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay)
        return;
    const titleEl = document.getElementById('onboardingTitle');
    const bodyEl = document.getElementById('onboardingBody');
    const primaryBtn = document.getElementById('onboardingPrimaryBtn');
    const closeBtn = document.getElementById('onboardingCloseBtn');
    const skipBtn = document.getElementById('onboardingSkipBtn');
    if (titleEl)
        titleEl.textContent = config.title;
    if (bodyEl)
        bodyEl.textContent = config.body;
    if (primaryBtn) {
        primaryBtn.textContent = config.primaryText;
        primaryBtn.href = config.primaryHref || '#';
        primaryBtn.onclick = (e) => {
            var _a;
            if (!config.primaryHref)
                e.preventDefault();
            (_a = config.onPrimary) === null || _a === void 0 ? void 0 : _a.call(config);
        };
    }
    if (closeBtn) {
        closeBtn.style.display = config.lockClose ? 'none' : 'inline-flex';
        closeBtn.onclick = () => overlay.classList.add('hidden');
    }
    if (skipBtn) {
        skipBtn.style.display = config.allowSkip ? 'inline-flex' : 'none';
        skipBtn.onclick = () => { var _a; return (_a = config.onSkip) === null || _a === void 0 ? void 0 : _a.call(config); };
    }
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('onboarding-visible'));
}
export function hideOnboardingOverlay() {
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay)
        return;
    overlay.classList.remove('onboarding-visible');
    setTimeout(() => overlay.classList.add('hidden'), 140);
}
