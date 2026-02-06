import { getCurrentUser, getToken, removeToken } from "./api.js";

export type AuthStatus = "checking" | "authenticated" | "unauthenticated" | "public" | "error";

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
    "/index.html",
    "/login",
    "/login.html",
    "/register",
    "/register.html",
    "/forgot-password",
    "/forgot-password.html",
    "/reset-password",
    "/reset-password.html",
];

const authState: AuthState = {
    status: "checking",
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
    } catch {
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

function safeGetToken(): string | null {
    try {
        return getToken();
    } catch {
        return null;
    }
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

function resolveState(status: AuthStatus, payload?: Partial<AuthState>) {
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
    if (isPublicRoute(currentPath) || currentPath.endsWith(loginPath)) {
        return;
    }
    const loginUrl = buildLoginUrl(loginPath, currentPath);
    window.location.href = loginUrl;
}

export async function initAuthGate(options?: { loginPath?: string }) {
    const loginPath = options?.loginPath || "login.html";
    const currentPath = window.location.pathname;
    const publicRoute = isPublicRoute(currentPath);

    resolveState("checking");

    try {
        if (publicRoute) {
            const token = safeGetToken();
            resolveState("public", { isAuthenticated: !!token, token, user: null });
            return;
        }

        const token = safeGetToken();
        if (!token) {
            resolveState("unauthenticated", { isAuthenticated: false, token: null, user: null });
            redirectToLogin(loginPath, currentPath);
            return;
        }

        const user = await getCurrentUser();
        resolveState("authenticated", { isAuthenticated: true, token, user });
    } catch (error: any) {
        const statusCode = error?.status ?? error?.response?.status;
        removeToken();
        if (statusCode === 401 || statusCode === 403) {
            resolveState("unauthenticated", { isAuthenticated: false, token: null, user: null });
            redirectToLogin(loginPath, currentPath);
            return;
        }
        resolveState("error", { isAuthenticated: false, token: null, user: null });
        redirectToLogin(loginPath, currentPath);
    }
}

window.addEventListener("auth:expired", () => {
    const currentPath = window.location.pathname;
    resolveState("unauthenticated", { isAuthenticated: false, token: null, user: null });
    redirectToLogin("login.html", currentPath);
});
