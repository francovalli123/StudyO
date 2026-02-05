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
import { getCurrentLanguage, setCurrentLanguage, applyTranslations } from './i18n.js';
const STORAGE_KEY = 'studyo_onboarding_context';
const STARTED_MARK_KEY = 'studyo_onboarding_started';
const EVENT_ONCE_PREFIX = 'studyo_onboarding_event_once_';
const LANG_AUTO_KEY_PREFIX = 'studyo_onboarding_lang_auto_';
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
function getOverlayElements() {
    return {
        overlay: document.getElementById('onboardingOverlay'),
        titleEl: document.getElementById('onboardingTitle'),
        bodyEl: document.getElementById('onboardingBody'),
        primaryBtn: document.getElementById('onboardingPrimaryBtn'),
        closeBtn: document.getElementById('onboardingCloseBtn'),
        skipBtn: document.getElementById('onboardingSkipBtn'),
    };
}
function showOnboardingToast(message) {
    let toast = document.getElementById('onboardingToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'onboardingToast';
        toast.className = 'onboarding-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('show');
    requestAnimationFrame(() => toast.classList.add('show'));
    setTimeout(() => toast === null || toast === void 0 ? void 0 : toast.classList.remove('show'), 1400);
}
function transitionFromCurrentStep(expected, next) {
    return __awaiter(this, void 0, void 0, function* () {
        const ctx = getOnboardingContext();
        if (!ctx || !ctx.active || ctx.step !== expected)
            return false;
        yield persistOnboardingStep(next);
        const nextCtx = getOnboardingContext();
        if (nextCtx) {
            nextCtx.step = next;
            nextCtx.active = true;
            nextCtx.updatedAt = Date.now();
            saveContext(nextCtx);
        }
        return true;
    });
}
function detectLanguageByCountry(country) {
    const c = (country || '').toUpperCase();
    const pt = new Set(['BR', 'PT']);
    const zh = new Set(['CN']);
    const en = new Set(['US', 'GB', 'CA', 'AU', 'NZ', 'IE']);
    const es = new Set(['AR', 'BO', 'CL', 'CO', 'CR', 'CU', 'DO', 'EC', 'SV', 'GT', 'HN', 'MX', 'NI', 'PA', 'PY', 'PE', 'PR', 'UY', 'VE', 'ES']);
    if (pt.has(c))
        return 'pt';
    if (zh.has(c))
        return 'zh';
    if (en.has(c))
        return 'en';
    if (es.has(c))
        return 'es';
    return 'en';
}
function ensureOnboardingLanguage(user) {
    const perUserKey = `${LANG_AUTO_KEY_PREFIX}${user.id}`;
    if (localStorage.getItem(perUserKey) === '1')
        return;
    const saved = localStorage.getItem('appLanguage');
    if (!saved) {
        const next = detectLanguageByCountry(user.country);
        setCurrentLanguage(next);
        try {
            applyTranslations();
        }
        catch (_) { }
    }
    localStorage.setItem(perUserKey, '1');
}
const onboardingCopy = {
    es: {
        stepCreateSubjectTitle: 'Paso 1: Creá tu primera asignatura',
        stepCreateSubjectBody: 'Creá 1 asignatura para activar el tracking real de tu estudio.',
        createSubject: 'Crear asignatura',
        stepCreateHabitTitle: 'Paso 2: Creá un hábito',
        stepCreateHabitBody: 'Ahora creá un hábito y revisá “Hábito clave”.',
        createHabit: 'Crear hábito',
        goToHabits: 'Ir a hábitos',
        stepConfigPomodoroTitle: 'Paso 3: Configurá Pomodoro',
        stepConfigPomodoroBody: 'Definí una materia por defecto para registrar bien tus sesiones.',
        goToDashboard: 'Ir a dashboard',
        subjectCreatedToast: '¡Asignatura lista! Sigamos con hábitos.',
        habitCreatedToast: '¡Hábito creado! Configuramos Pomodoro.',
    },
    en: {
        stepCreateSubjectTitle: 'Step 1: Create your first subject',
        stepCreateSubjectBody: 'Create 1 subject to enable real study tracking.',
        createSubject: 'Create subject',
        stepCreateHabitTitle: 'Step 2: Create a habit',
        stepCreateHabitBody: 'Now create a habit and review “Key habit”.',
        createHabit: 'Create habit',
        goToHabits: 'Go to habits',
        stepConfigPomodoroTitle: 'Step 3: Configure Pomodoro',
        stepConfigPomodoroBody: 'Set a default subject to track sessions correctly.',
        goToDashboard: 'Go to dashboard',
        subjectCreatedToast: "Subject created! Let's continue with habits.",
        habitCreatedToast: "Habit created! Let's configure Pomodoro.",
    },
    pt: {
        stepCreateSubjectTitle: 'Passo 1: Crie sua primeira disciplina',
        stepCreateSubjectBody: 'Crie 1 disciplina para ativar o rastreamento real de estudo.',
        createSubject: 'Criar disciplina',
        stepCreateHabitTitle: 'Passo 2: Crie um hábito',
        stepCreateHabitBody: 'Agora crie um hábito e revise “Hábito-chave”.',
        createHabit: 'Criar hábito',
        goToHabits: 'Ir para hábitos',
        stepConfigPomodoroTitle: 'Passo 3: Configure o Pomodoro',
        stepConfigPomodoroBody: 'Defina uma disciplina padrão para registrar sessões corretamente.',
        goToDashboard: 'Ir para dashboard',
        subjectCreatedToast: 'Disciplina criada! Vamos aos hábitos.',
        habitCreatedToast: 'Hábito criado! Vamos configurar o Pomodoro.',
    },
    zh: {
        stepCreateSubjectTitle: '步骤 1：创建你的第一门科目',
        stepCreateSubjectBody: '先创建 1 门科目，才能开始真实学习追踪。',
        createSubject: '创建科目',
        stepCreateHabitTitle: '步骤 2：创建一个习惯',
        stepCreateHabitBody: '现在创建一个习惯，并查看“关键习惯”。',
        createHabit: '创建习惯',
        goToHabits: '前往习惯',
        stepConfigPomodoroTitle: '步骤 3：配置番茄钟',
        stepConfigPomodoroBody: '设置默认科目，以便正确记录学习会话。',
        goToDashboard: '前往仪表盘',
        subjectCreatedToast: '科目创建成功！继续设置习惯。',
        habitCreatedToast: '习惯创建成功！继续配置番茄钟。',
    }
};
function getOnboardingText(key) {
    var _a;
    const lang = getCurrentLanguage();
    return ((_a = onboardingCopy[lang]) === null || _a === void 0 ? void 0 : _a[key]) || onboardingCopy.en[key] || key;
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
    ensureOnboardingLanguage(user);
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
        const moved = yield transitionFromCurrentStep('CREATE_SUBJECT', 'CREATE_HABIT');
        if (!moved)
            return;
        showOnboardingToast(getOnboardingText('subjectCreatedToast'));
        showOnboardingOverlay({
            title: getOnboardingText('stepCreateHabitTitle'),
            body: getOnboardingText('stepCreateHabitBody'),
            primaryText: getOnboardingText('goToHabits'),
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
export function onHabitCreated() {
    return __awaiter(this, void 0, void 0, function* () {
        const moved = yield transitionFromCurrentStep('CREATE_HABIT', 'CONFIG_POMODORO');
        if (!moved)
            return;
        showOnboardingToast(getOnboardingText('habitCreatedToast'));
        showOnboardingOverlay({
            title: getOnboardingText('stepConfigPomodoroTitle'),
            body: getOnboardingText('stepConfigPomodoroBody'),
            primaryText: getOnboardingText('goToDashboard'),
            primaryHref: 'dashboard.html',
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
    const { overlay, titleEl, bodyEl, primaryBtn, closeBtn, skipBtn } = getOverlayElements();
    if (!overlay)
        return;
    if (titleEl)
        titleEl.textContent = config.title;
    if (bodyEl)
        bodyEl.textContent = config.body;
    if (primaryBtn) {
        primaryBtn.textContent = config.primaryText;
        primaryBtn.href = config.primaryHref || '#';
        primaryBtn.classList.add('onboarding-cta-pulse');
        primaryBtn.onclick = (e) => {
            var _a;
            if (!config.primaryHref)
                e.preventDefault();
            hideOnboardingOverlay();
            (_a = config.onPrimary) === null || _a === void 0 ? void 0 : _a.call(config);
        };
    }
    if (closeBtn) {
        closeBtn.style.display = config.lockClose ? 'none' : 'inline-flex';
        closeBtn.onclick = () => hideOnboardingOverlay();
    }
    if (skipBtn) {
        skipBtn.style.display = config.allowSkip ? 'inline-flex' : 'none';
        skipBtn.onclick = () => { var _a; return (_a = config.onSkip) === null || _a === void 0 ? void 0 : _a.call(config); };
    }
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('onboarding-visible'));
}
export function hideOnboardingOverlay() {
    const { overlay } = getOverlayElements();
    if (!overlay)
        return;
    overlay.classList.remove('onboarding-visible');
    setTimeout(() => overlay.classList.add('hidden'), 160);
}
