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
        window.dispatchEvent(new CustomEvent("auth:state", {
            detail: window.__studyoAuthState,
        }));
    }
    catch (_a) {
        /* noop */
    }
}
/**
 * Loader SOLO para rutas protegidas
 */
function ensureAuthLoadingUI() {
    if (document.getElementById("auth-loading"))
        return;
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
    var _a;
    document.documentElement.classList.remove("auth-pending");
    (_a = document.getElementById("auth-loading")) === null || _a === void 0 ? void 0 : _a.remove();
}
function isPublicRoute(pathname) {
    return PUBLIC_ROUTES.includes(pathname);
}
function safeGetToken() {
    try {
        return getToken();
    }
    catch (_a) {
        return null;
    }
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
    if (isPublicRoute(currentPath))
        return;
    if (currentPath.endsWith(loginPath))
        return;
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
export function initAuthGate(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c;
        const loginPath = (_a = options === null || options === void 0 ? void 0 : options.loginPath) !== null && _a !== void 0 ? _a : "login.html";
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
            const user = yield getCurrentUser();
            resolveState("authenticated", {
                isAuthenticated: true,
                token,
                user,
            });
        }
        catch (err) {
            removeToken();
            const statusCode = (_b = err === null || err === void 0 ? void 0 : err.status) !== null && _b !== void 0 ? _b : (_c = err === null || err === void 0 ? void 0 : err.response) === null || _c === void 0 ? void 0 : _c.status;
            if (statusCode === 401 || statusCode === 403) {
                resolveState("unauthenticated", {
                    isAuthenticated: false,
                    token: null,
                    user: null,
                });
            }
            else {
                resolveState("error", {
                    isAuthenticated: false,
                    token: null,
                    user: null,
                });
            }
            redirectToLogin(loginPath, currentPath);
        }
    });
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
