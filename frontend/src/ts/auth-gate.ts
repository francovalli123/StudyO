import { getCurrentUser, getToken, removeToken } from "./api.js";

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

/**
 * Rutas que NO requieren autenticación
 * Estas páginas JAMÁS deben quedar bloqueadas por el auth gate
 */
const PUBLIC_ROUTES = [
    "/",
    "/index.html",
    "/login.html",
    "/register.html",
    "/forgot-password.html",
    "/reset-password.html",
];

const authState: AuthState = {
    status: "checking",
    isAuthenticated: false,
    token: null,
    user: null,
    authResolved: false,
};

const AUTH_CHECK_TIMEOUT_MS = 8000;

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

function resetGlobalScaleState() {
    const targets = [document.documentElement, document.body].filter(
        (el): el is HTMLElement => Boolean(el)
    );
    const properties = ["zoom", "transform", "transform-origin"];

    targets.forEach((el) => {
        properties.forEach((prop) => el.style.removeProperty(prop));
        el.style.setProperty("zoom", "1");
        el.style.setProperty("transform", "none");
        el.style.setProperty("transform-origin", "0 0")
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

/**
 * Loader SOLO para rutas protegidas
 */
function ensureAuthLoadingUI() {
    if (document.getElementById("auth-loading")) return;

    const loader = document.createElement("div");
    loader.id = "auth-loading";
    loader.innerHTML = `
        <div class="auth-loading-spinner"></div>
        <div class="auth-loading-text">Verificando sesión...</div>
    `;
    document.body.appendChild(loader);
    document.documentElement.classList.add("auth-pending");
}

function clearAuthLoadingUI() {
    document.documentElement.classList.remove("auth-pending");
    document.getElementById("auth-loading")?.remove();
}

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.includes(pathname);
}

function safeGetToken(): string | null {
    try {
        return getToken();
    } catch {
        return null;
    }
}

function resolveState(status: AuthStatus, payload?: Partial<AuthState>) {
    document.documentElement.classList.remove("auth-pending");
    document.getElementById("auth-loading")?.remove();
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
    if (isPublicRoute(currentPath)) return;
    if (currentPath.endsWith(loginPath)) return;

    const next = encodeURIComponent(window.location.href);
    window.location.href = `${loginPath}?next=${next}`;
}

/**
 * INIT AUTH GATE
 * ─────────────────────────────────────────────
 * ✔ Nunca deja la UI en checking infinito
 * ✔ Páginas públicas renderizan instantáneo
 * ✔ Rutas protegidas validan token correctamente
 */
export async function initAuthGate(options?: { loginPath?: string }) {
    document.documentElement.classList.remove("auth-pending");
    document.getElementById("auth-loading")?.remove();
    resetGlobalScaleState();
    const loginPath = options?.loginPath ?? "login.html";
    const currentPath = window.location.pathname;
    const isPublic = isPublicRoute(currentPath);

    // 🔓 RUTAS PÚBLICAS → resolver inmediatamente
    if (isPublic) {
        const token = safeGetToken();
        resolveState("public", {
            isAuthenticated: !!token,
            token,
            user: null,
        });
        return;
    }

    // 🔒 RUTAS PROTEGIDAS → mostrar loader
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

    try {
        const user = await withTimeout(getCurrentUser(), AUTH_CHECK_TIMEOUT_MS, "Auth check timeout");

        resolveState("authenticated", {
            isAuthenticated: true,
            token,
            user,
        });
    } catch (err: any) {
        const statusCode = err?.status ?? err?.response?.status;

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

        resolveState("error", {
            isAuthenticated: false,
            token,
            user: null,
        });

        // Keep token on transient network/auth-service issues so user can retry without forced logout loop.
    }
}

/**
 * Expiración forzada desde cualquier parte del sistema
 */
window.addEventListener("auth:expired", () => {
    const currentPath = window.location.pathname;

    resolveState("unauthenticated", {
        isAuthenticated: false,
        token: null,
        user: null,
    });

    redirectToLogin("login.html", currentPath);
});
