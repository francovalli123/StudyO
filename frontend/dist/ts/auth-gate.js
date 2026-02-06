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
    "/login",
    "/login.html",
    "/register",
    "/register.html",
    "/forgot-password",
    "/forgot-password.html",
    "/reset-password",
    "/reset-password.html",
];
const authState = {
    status: "checking",
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
    catch (_a) {
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
function safeGetToken() {
    try {
        return getToken();
    }
    catch (_a) {
        return null;
    }
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
function resolveState(status, payload) {
    updateAuthState(Object.assign({ status, authResolved: status !== "checking" }, payload));
    if (status === "checking") {
        ensureAuthLoadingUI();
    }
    else {
        clearAuthLoadingUI();
    }
}
function redirectToLogin(loginPath, currentPath) {
    if (isPublicRoute(currentPath) || currentPath.endsWith(loginPath)) {
        return;
    }
    const loginUrl = buildLoginUrl(loginPath, currentPath);
    window.location.href = loginUrl;
}
export function initAuthGate(options) {
    return __awaiter(this, void 0, void 0, function* () {
        const loginPath = (options === null || options === void 0 ? void 0 : options.loginPath) || "login.html";
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
            const user = yield getCurrentUser();
            resolveState("authenticated", { isAuthenticated: true, token, user });
        }
        catch (error) {
            var _a, _b;
            const statusCode = (_b = (_a = error === null || error === void 0 ? void 0 : error.status) !== null && _a !== void 0 ? _a : error === null || error === void 0 ? void 0 : error.response) === null || _b === void 0 ? void 0 : _b.status;
            removeToken();
            if (statusCode === 401 || statusCode === 403) {
                resolveState("unauthenticated", { isAuthenticated: false, token: null, user: null });
                redirectToLogin(loginPath, currentPath);
                return;
            }
            resolveState("error", { isAuthenticated: false, token: null, user: null });
            redirectToLogin(loginPath, currentPath);
        }
    });
}
window.addEventListener("auth:expired", () => {
    const currentPath = window.location.pathname;
    resolveState("unauthenticated", { isAuthenticated: false, token: null, user: null });
    redirectToLogin("login.html", currentPath);
});
