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

const PUBLIC_ROUTES = [
    "/",
    "/index.html",
    "/login.html",
    "/register.html",
    "/forgot-password.html",
    "/reset-password.html",
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

function isPublicRoute(route: string) {
    return PUBLIC_ROUTES.includes(route);
}

function shouldAppendNext(currentPath: string, loginPath: string) {
    if (isPublicRoute(currentPath)) {
        return false;
    }
    return !currentPath.endsWith(loginPath);
}

function buildLoginUrl(loginPath: string, currentPath: string) {
    if (!shouldAppendNext(currentPath, loginPath)) {
        return loginPath;
    }
    const next = encodeURIComponent(window.location.href);
    return `${loginPath}?next=${next}`;
}

export async function initAuthGate(options?: { loginPath?: string }) {
    const loginPath = options?.loginPath || "login.html";
    const currentPath = window.location.pathname;
    const publicRoute = isPublicRoute(currentPath);

    if (publicRoute) {
        const token = getToken();
        updateAuthState({ isAuthenticated: !!token, token, user: null, authResolved: true });
        clearAuthLoadingUI();
        return;
    }

    ensureAuthLoadingUI();
    updateAuthState({ authResolved: false });

    const token = getToken();
    if (!token) {
        updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
        clearAuthLoadingUI();
        const loginUrl = buildLoginUrl(loginPath, currentPath);
        if (!currentPath.endsWith(loginPath)) {
            window.location.href = loginUrl;
        }
        return;
    }

    try {
        const user = await getCurrentUser();
        updateAuthState({ isAuthenticated: true, token, user, authResolved: true });
        clearAuthLoadingUI();
    } catch (error) {
        removeToken();
        updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
        clearAuthLoadingUI();
        const loginUrl = buildLoginUrl(loginPath, currentPath);
        if (!currentPath.endsWith(loginPath)) {
            window.location.href = loginUrl;
        }
    }
}

window.addEventListener("auth:expired", () => {
    updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
    const currentPath = window.location.pathname;
    if (!isPublicRoute(currentPath) && !currentPath.endsWith("login.html")) {
        const loginUrl = buildLoginUrl("login.html", currentPath);
        window.location.href = loginUrl;
    }
});
