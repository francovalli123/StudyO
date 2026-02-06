import { getCurrentUser, getToken, removeToken } from "./api.js";

export interface AuthState {
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

const DEFAULT_PUBLIC_ROUTES = [
    "login.html",
    "register.html",
    "forgot-password.html",
    "reset-password.html"
];

const authState: AuthState = {
    isAuthenticated: false,
    token: null,
    user: null,
    authResolved: false,
};

function updateAuthState(next: Partial<AuthState>) {
    Object.assign(authState, next);
    window.__studyoAuthState = { ...authState };
    try {
        window.dispatchEvent(new CustomEvent("auth:state", { detail: window.__studyoAuthState }));
    } catch (e) {
        // noop
    }
}

function ensureAuthLoadingUI() {
    const existing = document.getElementById("auth-loading");
    if (!existing) {
        const loader = document.createElement("div");
        loader.id = "auth-loading";
        loader.innerHTML = `
            <div class="auth-loading-spinner"></div>
            <div class="auth-loading-text">Verificando sesión...</div>
        `;
        document.body.appendChild(loader);
    }
    document.documentElement.classList.add("auth-pending");
}

function clearAuthLoadingUI() {
    document.documentElement.classList.remove("auth-pending");
}

function isPublicRoute(route: string, publicRoutes: string[]) {
    return publicRoutes.some((entry) => route.endsWith(entry));
}

function redirectToLogin(loginPath: string) {
    const next = encodeURIComponent(window.location.href);
    window.location.href = `${loginPath}?next=${next}`;
}

export async function initAuthGate(options?: { mode?: "public" | "protected"; loginPath?: string; publicRoutes?: string[]; redirectAuthenticatedTo?: string }) {
    const publicRoutes = options?.publicRoutes || DEFAULT_PUBLIC_ROUTES;
    const loginPath = options?.loginPath || "login.html";
    const mode = options?.mode || (isPublicRoute(window.location.pathname, publicRoutes) ? "public" : "protected");

    ensureAuthLoadingUI();
    updateAuthState({ authResolved: false });

    const token = getToken();
    if (!token) {
        updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
        clearAuthLoadingUI();
        if (mode === "protected") {
            redirectToLogin(loginPath);
        }
        return;
    }

    try {
        const user = await getCurrentUser();
        updateAuthState({ isAuthenticated: true, token, user, authResolved: true });
        clearAuthLoadingUI();
        if (mode === "public" && options?.redirectAuthenticatedTo) {
            window.location.href = options.redirectAuthenticatedTo;
        }
    } catch (error) {
        removeToken();
        updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
        clearAuthLoadingUI();
        if (mode === "protected") {
            redirectToLogin(loginPath);
        }
    }
}

window.addEventListener("auth:expired", () => {
    updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
    if (!isPublicRoute(window.location.pathname, DEFAULT_PUBLIC_ROUTES)) {
        redirectToLogin("login.html");
    }
});
