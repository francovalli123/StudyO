var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getCurrentUser, getToken, removeToken } from "./api.js";
const PUBLIC_ROUTES = [
    "/",
    "/index.html",
    "/login.html",
    "/register.html",
    "/forgot-password.html",
    "/reset-password.html",
];
const authState = {
    isAuthenticated: false,
    token: null,
    user: null,
    authResolved: false,
};
function updateAuthState(next) {
    Object.assign(authState, next);
    window.__studyoAuthState = Object.assign({}, authState);
    try {
        window.dispatchEvent(new CustomEvent("auth:state", { detail: window.__studyoAuthState }));
    }
    catch (e) {
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
function isPublicRoute(route) {
    return PUBLIC_ROUTES.includes(route);
}
function shouldAppendNext(currentPath, loginPath) {
    if (isPublicRoute(currentPath)) {
        return false;
    }
    return !currentPath.endsWith(loginPath);
}
function buildLoginUrl(loginPath, currentPath) {
    if (!shouldAppendNext(currentPath, loginPath)) {
        return loginPath;
    }
    const next = encodeURIComponent(window.location.href);
    return `${loginPath}?next=${next}`;
}
export function initAuthGate(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const loginPath = (options === null || options === void 0 ? void 0 : options.loginPath) || "login.html";
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
            const user = yield getCurrentUser();
            updateAuthState({ isAuthenticated: true, token, user, authResolved: true });
            clearAuthLoadingUI();
        }
        catch (error) {
            removeToken();
            updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
            clearAuthLoadingUI();
            const loginUrl = buildLoginUrl(loginPath, currentPath);
            if (!currentPath.endsWith(loginPath)) {
                window.location.href = loginUrl;
            }
        }
    });
}
window.addEventListener("auth:expired", () => {
    updateAuthState({ isAuthenticated: false, token: null, user: null, authResolved: true });
    const currentPath = window.location.pathname;
    if (!isPublicRoute(currentPath) && !currentPath.endsWith("login.html")) {
        const loginUrl = buildLoginUrl("login.html", currentPath);
        window.location.href = loginUrl;
    }
});
