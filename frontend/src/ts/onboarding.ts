import { CurrentUser, OnboardingStep, apiGet, getCurrentUser, updateCurrentUser } from './api.js';

const STORAGE_KEY = 'studyo_onboarding_context';
const STARTED_MARK_KEY = 'studyo_onboarding_started';
const EVENT_ONCE_PREFIX = 'studyo_onboarding_event_once_';

interface OnboardingContext {
    active: boolean;
    step: OnboardingStep;
    hasSubjects: boolean;
    subjectsCount: number;
    updatedAt: number;
    userId: number;
}

function emitOnce(eventKey: string, emitter: () => void, userId?: number): void {
    const scope = userId ? `${userId}_` : '';
    const key = `${EVENT_ONCE_PREFIX}${scope}${eventKey}`;
    if (localStorage.getItem(key) === '1') return;
    emitter();
    localStorage.setItem(key, '1');
}

function track(eventName: string, payload?: Record<string, any>): void {
    const detail = { event: eventName, ...payload, ts: Date.now() };
    try { document.dispatchEvent(new CustomEvent('analytics:event', { detail })); } catch (_) {}
    try { document.dispatchEvent(new CustomEvent('onboarding:event', { detail })); } catch (_) {}
}

function saveContext(ctx: OnboardingContext): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ctx));
}

function loadContext(): OnboardingContext | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as OnboardingContext;
    } catch {
        return null;
    }
}

function getOverlayElements() {
    return {
        overlay: document.getElementById('onboardingOverlay'),
        titleEl: document.getElementById('onboardingTitle'),
        bodyEl: document.getElementById('onboardingBody'),
        primaryBtn: document.getElementById('onboardingPrimaryBtn') as HTMLAnchorElement | null,
        closeBtn: document.getElementById('onboardingCloseBtn') as HTMLButtonElement | null,
        skipBtn: document.getElementById('onboardingSkipBtn') as HTMLButtonElement | null,
    };
}

function showOnboardingToast(message: string): void {
    let toast = document.getElementById('onboardingToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'onboardingToast';
        toast.className = 'onboarding-toast';
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.remove('show');
    requestAnimationFrame(() => toast!.classList.add('show'));
    setTimeout(() => toast?.classList.remove('show'), 1400);
}

async function transitionFromCurrentStep(expected: OnboardingStep, next: OnboardingStep): Promise<boolean> {
    const ctx = getOnboardingContext();
    if (!ctx || !ctx.active || ctx.step !== expected) return false;

    await persistOnboardingStep(next);

    const nextCtx = getOnboardingContext();
    if (nextCtx) {
        nextCtx.step = next;
        nextCtx.active = true;
        nextCtx.updatedAt = Date.now();
        saveContext(nextCtx);
    }

    return true;
}

export function getOnboardingContext(): OnboardingContext | null {
    return loadContext();
}

export function shouldRunOnboarding(user: CurrentUser, subjectsCount: number): boolean {
    const step = user.onboarding_step || 'CREATE_SUBJECT';
    const finished = user.onboarding_completed === true || step === 'DONE' || step === 'SKIPPED';
    if (finished) return false;
    // CREATE_SUBJECT depends on having zero subjects; subsequent steps continue regardless.
    if (step === 'CREATE_SUBJECT') return subjectsCount === 0;
    return true;
}

export function storeOnboardingContext(user: CurrentUser, subjectsCount: number): OnboardingContext {
    const step = (user.onboarding_step || 'CREATE_SUBJECT') as OnboardingStep;
    const active = shouldRunOnboarding(user, subjectsCount);
    const ctx: OnboardingContext = {
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

export async function hydrateOnboardingContext(): Promise<OnboardingContext | null> {
    try {
        const user = await getCurrentUser();
        const subjects = await apiGet<any[]>('/subjects/');
        const count = Array.isArray(subjects) ? subjects.length : (user.subjects_count || 0);
        return storeOnboardingContext(user, count);
    } catch {
        return getOnboardingContext();
    }
}

export async function persistOnboardingStep(step: OnboardingStep): Promise<void> {
    const ctx = getOnboardingContext();
    if (ctx?.step === step) return;

    await updateCurrentUser({ onboarding_step: step });
    const nextCtx: OnboardingContext = {
        active: step !== 'DONE' && step !== 'SKIPPED',
        step,
        hasSubjects: ctx?.hasSubjects ?? false,
        subjectsCount: ctx?.subjectsCount ?? 0,
        updatedAt: Date.now(),
        userId: ctx?.userId ?? 0,
    };
    saveContext(nextCtx);
    emitOnce(`step_${step}`, () => track('onboarding_step_completed', { step }), nextCtx.userId);
}

export async function completeOnboarding(): Promise<void> {
    await updateCurrentUser({ onboarding_step: 'DONE', onboarding_completed: true });
    const ctx = getOnboardingContext();
    if (ctx) {
        ctx.active = false;
        ctx.step = 'DONE';
        ctx.updatedAt = Date.now();
        saveContext(ctx);
    }
    sessionStorage.removeItem(STARTED_MARK_KEY);
    emitOnce('completed', () => track('onboarding_completed', { step: 'DONE' }), ctx?.userId);
}

export async function skipOnboarding(): Promise<void> {
    await updateCurrentUser({ onboarding_step: 'SKIPPED' });
    const ctx = getOnboardingContext() || {
        active: false,
        step: 'SKIPPED' as OnboardingStep,
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
}

export async function onSubjectCreated(): Promise<void> {
    const moved = await transitionFromCurrentStep('CREATE_SUBJECT', 'CREATE_HABIT');
    if (!moved) return;

    showOnboardingToast('¡Asignatura lista! Sigamos con hábitos.');
    showOnboardingOverlay({
        title: 'Paso 2: Creá un hábito',
        body: 'Ahora creá un hábito y revisá “Hábito clave”.',
        primaryText: 'Ir a hábitos',
        primaryHref: 'habits.html',
        lockClose: false,
        allowSkip: true,
        onSkip: async () => {
            try { await skipOnboarding(); } catch (_) {}
            hideOnboardingOverlay();
        },
    });
}

export async function onHabitCreated(): Promise<void> {
    const moved = await transitionFromCurrentStep('CREATE_HABIT', 'CONFIG_POMODORO');
    if (!moved) return;

    showOnboardingToast('¡Hábito creado! Configuramos Pomodoro.');
    showOnboardingOverlay({
        title: 'Paso 3: Configurá Pomodoro',
        body: 'Ahora definí una materia por defecto para registrar bien tus sesiones.',
        primaryText: 'Ir a dashboard',
        primaryHref: 'dashboard.html',
        lockClose: false,
        allowSkip: true,
        onSkip: async () => {
            try { await skipOnboarding(); } catch (_) {}
            hideOnboardingOverlay();
        },
    });
}

export function syncOnboardingAcrossTabs(onChange?: (ctx: OnboardingContext | null) => void): void {
    window.addEventListener('storage', (event) => {
        if (event.key !== STORAGE_KEY) return;
        onChange?.(getOnboardingContext());
    });
}

export function showOnboardingOverlay(config: {
    title: string;
    body: string;
    primaryText: string;
    primaryHref?: string;
    lockClose?: boolean;
    onPrimary?: () => void;
    allowSkip?: boolean;
    onSkip?: () => void;
}): void {
    const { overlay, titleEl, bodyEl, primaryBtn, closeBtn, skipBtn } = getOverlayElements();
    if (!overlay) return;

    if (titleEl) titleEl.textContent = config.title;
    if (bodyEl) bodyEl.textContent = config.body;

    if (primaryBtn) {
        primaryBtn.textContent = config.primaryText;
        primaryBtn.href = config.primaryHref || '#';
        primaryBtn.classList.add('onboarding-cta-pulse');
        primaryBtn.onclick = (e) => {
            if (!config.primaryHref) e.preventDefault();
            config.onPrimary?.();
        };
    }

    if (closeBtn) {
        closeBtn.style.display = config.lockClose ? 'none' : 'inline-flex';
        closeBtn.onclick = () => hideOnboardingOverlay();
    }

    if (skipBtn) {
        skipBtn.style.display = config.allowSkip ? 'inline-flex' : 'none';
        skipBtn.onclick = () => config.onSkip?.();
    }

    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('onboarding-visible'));
}

export function hideOnboardingOverlay(): void {
    const { overlay } = getOverlayElements();
    if (!overlay) return;
    overlay.classList.remove('onboarding-visible');
    setTimeout(() => overlay.classList.add('hidden'), 160);
}
