import { ApiError, getCurrentUser, getToken, removeToken } from "./api.js";

export type AuthStatus =
    | "checking"
    | "authenticated"
    | "unauthenticated"
    | "public"
    | "error";

export interface AuthState {
    status: AuthStatus;
    isAuthenticated: boolean;
    token: string | null;
    user: any | null;
    authResolved: boolean;
}

declare global {
    interface Window {
        __studyoAuthState?: AuthState;
    }
}

const PUBLIC_ROUTES = [
    "/",
    "/index",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
];

const authState: AuthState = {
    status: "checking",
    isAuthenticated: false,
    token: null,
    user: null,
    authResolved: false,
};

const AUTH_CHECK_TIMEOUT_MS = 8000;
const AUTH_RETRY_ATTEMPTS = 1;
const AUTH_RETRY_DELAY_MS = 1200;

function getAuthCheckingText(): string {
    const lang = localStorage.getItem("appLanguage");
    if (lang === "en") return "Checking session...";
    if (lang === "pt") return "Verificando sessão...";
    if (lang === "zh") return "Checking session...";
    return "Verificando sesión...";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        promise
            .then((value) => {
                window.clearTimeout(timer);
                resolve(value);
            })
            .catch((error) => {
                window.clearTimeout(timer);
                reject(error);
            });
    });
}

function wait(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function resetGlobalScaleState() {
    const targets = [document.documentElement, document.body].filter(
        (el): el is HTMLElement => Boolean(el)
    );
    const properties = ["zoom", "transform", "transform-origin"];

    targets.forEach((el) => {
        properties.forEach((prop) => el.style.removeProperty(prop));
        el.style.setProperty("zoom", "1");
        el.style.setProperty("transform", "none");
        el.style.setProperty("transform-origin", "0 0");
    });
}

function updateAuthState(next: Partial<AuthState>) {
    Object.assign(authState, next);
    window.__studyoAuthState = { ...authState };

    try {
        window.dispatchEvent(
            new CustomEvent("auth:state", {
                detail: window.__studyoAuthState,
            })
        );
    } catch {
        /* noop */
    }
}

function ensureAuthLoadingUI() {
    if (document.getElementById("auth-loading")) return;

    const loader = document.createElement("div");
    loader.id = "auth-loading";
    loader.innerHTML = `
        <div class="auth-loading-spinner"></div>
        <div class="auth-loading-text">${getAuthCheckingText()}</div>
    `;
    document.body.appendChild(loader);
    document.documentElement.classList.add("auth-pending");
}

function clearAuthLoadingUI() {
    document.documentElement.classList.remove("auth-pending");
    document.getElementById("auth-loading")?.remove();
}

function clearAuthErrorUI(): void {
    document.getElementById("auth-error")?.remove();
}

function ensureAuthErrorUI(loginPath: string, detail?: string): void {
    let panel = document.getElementById("auth-error") as HTMLDivElement | null;
    if (!panel) {
        panel = document.createElement("div");
        panel.id = "auth-error";
        panel.style.position = "fixed";
        panel.style.left = "50%";
        panel.style.bottom = "24px";
        panel.style.transform = "translateX(-50%)";
        panel.style.zIndex = "10000";
        panel.style.maxWidth = "640px";
        panel.style.width = "calc(100% - 32px)";
        panel.style.background = "rgba(13,16,22,0.98)";
        panel.style.border = "1px solid rgba(168,85,247,0.45)";
        panel.style.borderRadius = "14px";
        panel.style.padding = "14px";
        panel.style.boxShadow = "0 8px 26px rgba(0,0,0,0.35)";
        panel.style.color = "#e5e7eb";
        panel.innerHTML = `
            <div style="font-size:14px;font-weight:600;margin-bottom:8px">No se pudo validar tu sesiÃ³n.</div>
            <div id="auth-error-detail" style="font-size:13px;opacity:.9;margin-bottom:12px"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
                <button id="auth-retry-btn" type="button" style="background:#1f2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px 12px;cursor:pointer">Reintentar</button>
                <button id="auth-login-btn" type="button" style="background:linear-gradient(90deg,#7c3aed,#d946ef);color:#fff;border:none;border-radius:8px;padding:7px 12px;cursor:pointer">Ir al login</button>
            </div>
        `;
        document.body.appendChild(panel);

        panel.querySelector<HTMLButtonElement>("#auth-retry-btn")?.addEventListener("click", () => {
            void initAuthGate({ loginPath });
        });

        panel.querySelector<HTMLButtonElement>("#auth-login-btn")?.addEventListener("click", () => {
            const currentPath = window.location.pathname;
            redirectToLogin(loginPath, currentPath);
        });
    }

    const detailNode = panel.querySelector<HTMLDivElement>("#auth-error-detail");
    if (detailNode) {
        detailNode.textContent = detail || "Revisa tu conexiÃ³n o intenta nuevamente.";
    }
}

function normalizeRoutePath(pathname: string): string {
    let normalized = pathname || "/";
    if (!normalized.startsWith("/")) normalized = `/${normalized}`;
    if (normalized.length > 1 && normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    if (normalized.endsWith(".html")) normalized = normalized.slice(0, -5);
    return normalized || "/";
}

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.includes(normalizeRoutePath(pathname));
}

function safeGetToken(): string | null {
    try {
        return getToken();
    } catch {
        return null;
    }
}

function getErrorStatus(err: unknown): number | undefined {
    if (err instanceof ApiError) return err.status;
    const status = (err as any)?.status ?? (err as any)?.response?.status;
    return typeof status === "number" ? status : undefined;
}

function getErrorMessage(err: unknown): string {
    const message = (err as any)?.message;
    return typeof message === "string" && message.trim().length ? message : "Error de conexiÃ³n";
}

function isRetryableAuthError(statusCode: number | undefined, err: unknown): boolean {
    if (statusCode === 401 || statusCode === 403) return false;
    const message = getErrorMessage(err).toLowerCase();
    if (message.includes("auth check timeout")) return true;
    if (message.includes("network") || message.includes("failed to fetch")) return true;
    return statusCode === undefined || statusCode >= 500;
}

function resolveState(status: AuthStatus, payload?: Partial<AuthState>) {
    document.documentElement.classList.remove("auth-pending");
    document.getElementById("auth-loading")?.remove();
    if (status !== "error") {
        clearAuthErrorUI();
    }

    updateAuthState({
        status,
        authResolved: status !== "checking",
        ...payload,
    });

    if (status === "checking") {
        ensureAuthLoadingUI();
    } else {
        clearAuthLoadingUI();
    }
}

function redirectToLogin(loginPath: string, currentPath: string) {
    const normalizedCurrentPath = normalizeRoutePath(currentPath);
    const normalizedLoginPath = normalizeRoutePath(loginPath);

    if (isPublicRoute(currentPath)) return;
    if (normalizedCurrentPath === normalizedLoginPath) return;

    const next = encodeURIComponent(window.location.href);
    window.location.href = `${normalizedLoginPath}?next=${next}`;
}

export async function initAuthGate(options?: { loginPath?: string }) {
    document.documentElement.classList.remove("auth-pending");
    document.getElementById("auth-loading")?.remove();
    clearAuthErrorUI();
    resetGlobalScaleState();

    const loginPath = options?.loginPath ?? "/login";
    const currentPath = window.location.pathname;
    const isPublic = isPublicRoute(currentPath);

    if (isPublic) {
        const token = safeGetToken();
        resolveState("public", {
            isAuthenticated: !!token,
            token,
            user: null,
        });
        return;
    }

    resolveState("checking");

    const token = safeGetToken();

    if (!token) {
        resolveState("unauthenticated", {
            isAuthenticated: false,
            token: null,
            user: null,
        });
        redirectToLogin(loginPath, currentPath);
        return;
    }

    let attempts = 0;

    while (attempts <= AUTH_RETRY_ATTEMPTS) {
        try {
            const user = await withTimeout(getCurrentUser(), AUTH_CHECK_TIMEOUT_MS, "Auth check timeout");

            resolveState("authenticated", {
                isAuthenticated: true,
                token,
                user,
            });
            return;
        } catch (err: unknown) {
            const statusCode = getErrorStatus(err);

            if (statusCode === 401 || statusCode === 403) {
                removeToken();
                resolveState("unauthenticated", {
                    isAuthenticated: false,
                    token: null,
                    user: null,
                });
                redirectToLogin(loginPath, currentPath);
                return;
            }

            if (attempts < AUTH_RETRY_ATTEMPTS && isRetryableAuthError(statusCode, err)) {
                attempts += 1;
                await wait(AUTH_RETRY_DELAY_MS * attempts);
                continue;
            }

            resolveState("error", {
                isAuthenticated: false,
                token,
                user: null,
            });
            ensureAuthErrorUI(loginPath, getErrorMessage(err));
            return;
        }
    }
}

window.addEventListener("auth:expired", () => {
    const currentPath = window.location.pathname;

    resolveState("unauthenticated", {
        isAuthenticated: false,
        token: null,
        user: null,
    });

    redirectToLogin("/login", currentPath);
});


