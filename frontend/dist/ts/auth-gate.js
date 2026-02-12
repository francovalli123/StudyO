var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { ApiError, getCurrentUser, getToken, removeToken } from "./api.js";
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
const AUTH_CHECK_TIMEOUT_MS = 8000;
const AUTH_RETRY_ATTEMPTS = 1;
const AUTH_RETRY_DELAY_MS = 1200;
function withTimeout(promise, timeoutMs, timeoutMessage) {
    return new Promise((resolve, reject) => {
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
function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function resetGlobalScaleState() {
    const targets = [document.documentElement, document.body].filter((el) => Boolean(el));
    const properties = ["zoom", "transform", "transform-origin"];
    targets.forEach((el) => {
        properties.forEach((prop) => el.style.removeProperty(prop));
        el.style.setProperty("zoom", "1");
        el.style.setProperty("transform", "none");
        el.style.setProperty("transform-origin", "0 0");
    });
}
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
function clearAuthErrorUI() {
    var _a;
    (_a = document.getElementById("auth-error")) === null || _a === void 0 ? void 0 : _a.remove();
}
function ensureAuthErrorUI(loginPath, detail) {
    var _a, _b;
    let panel = document.getElementById("auth-error");
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
            <div style="font-size:14px;font-weight:600;margin-bottom:8px">No se pudo validar tu sesión.</div>
            <div id="auth-error-detail" style="font-size:13px;opacity:.9;margin-bottom:12px"></div>
            <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap">
                <button id="auth-retry-btn" type="button" style="background:#1f2937;color:#fff;border:1px solid #374151;border-radius:8px;padding:7px 12px;cursor:pointer">Reintentar</button>
                <button id="auth-login-btn" type="button" style="background:linear-gradient(90deg,#7c3aed,#d946ef);color:#fff;border:none;border-radius:8px;padding:7px 12px;cursor:pointer">Ir al login</button>
            </div>
        `;
        document.body.appendChild(panel);
        (_a = panel.querySelector("#auth-retry-btn")) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => {
            void initAuthGate({ loginPath });
        });
        (_b = panel.querySelector("#auth-login-btn")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => {
            const currentPath = window.location.pathname;
            redirectToLogin(loginPath, currentPath);
        });
    }
    const detailNode = panel.querySelector("#auth-error-detail");
    if (detailNode) {
        detailNode.textContent = detail || "Revisa tu conexión o intenta nuevamente.";
    }
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
function getErrorStatus(err) {
    var _a, _b;
    if (err instanceof ApiError)
        return err.status;
    const status = (_a = err === null || err === void 0 ? void 0 : err.status) !== null && _a !== void 0 ? _a : (_b = err === null || err === void 0 ? void 0 : err.response) === null || _b === void 0 ? void 0 : _b.status;
    return typeof status === "number" ? status : undefined;
}
function getErrorMessage(err) {
    const message = err === null || err === void 0 ? void 0 : err.message;
    return typeof message === "string" && message.trim().length ? message : "Error de conexión";
}
function isRetryableAuthError(statusCode, err) {
    if (statusCode === 401 || statusCode === 403)
        return false;
    const message = getErrorMessage(err).toLowerCase();
    if (message.includes("auth check timeout"))
        return true;
    if (message.includes("network") || message.includes("failed to fetch"))
        return true;
    return statusCode === undefined || statusCode >= 500;
}
function resolveState(status, payload) {
    var _a;
    document.documentElement.classList.remove("auth-pending");
    (_a = document.getElementById("auth-loading")) === null || _a === void 0 ? void 0 : _a.remove();
    if (status !== "error") {
        clearAuthErrorUI();
    }
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
export function initAuthGate(options) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        document.documentElement.classList.remove("auth-pending");
        (_a = document.getElementById("auth-loading")) === null || _a === void 0 ? void 0 : _a.remove();
        clearAuthErrorUI();
        resetGlobalScaleState();
        const loginPath = (_b = options === null || options === void 0 ? void 0 : options.loginPath) !== null && _b !== void 0 ? _b : "login.html";
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
                const user = yield withTimeout(getCurrentUser(), AUTH_CHECK_TIMEOUT_MS, "Auth check timeout");
                resolveState("authenticated", {
                    isAuthenticated: true,
                    token,
                    user,
                });
                return;
            }
            catch (err) {
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
                    yield wait(AUTH_RETRY_DELAY_MS * attempts);
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
    });
}
window.addEventListener("auth:expired", () => {
    const currentPath = window.location.pathname;
    resolveState("unauthenticated", {
        isAuthenticated: false,
        token: null,
        user: null,
    });
    redirectToLogin("login.html", currentPath);
});
