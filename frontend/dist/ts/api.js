var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 * API CONFIGURATION
 * We are using a hardcoded URL to avoid 'import.meta' errors with your current TS config.
 * Ideally, this should come from environment variables in the future.
 */
const BASE_URL = "http://127.0.0.1:8000/api";
/**
 * ==========================================
 * Token Management
 * ==========================================
 */
export function getToken() {
    return localStorage.getItem('authToken');
}
export function setToken(token) {
    localStorage.setItem('authToken', token);
}
export function removeToken() {
    localStorage.removeItem('authToken');
}
export function isAuthenticated() {
    return !!getToken();
}
/**
 * ==========================================
 * Private Helpers (Internal Use)
 * ==========================================
 */
/**
 * Helper to construct headers with the auth token if available.
 */
function getHeaders(contentType = "application/json") {
    const headers = {
        "Content-Type": contentType,
    };
    const token = getToken();
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }
    return headers;
}
/**
 * Centralized request handler to manage responses and errors globally.
 */
function handleRequest(response) {
    return __awaiter(this, void 0, void 0, function* () {
        // Handle 401 Unauthorized globally
        if (response.status === 401) {
            removeToken();
            // Optional: You could trigger a page reload or redirect here
            throw new Error("Session expired. Please login again.");
        }
        // Handle 204 No Content (common in DELETE or empty PUTs)
        if (response.status === 204) {
            return null;
        }
        // Handle standard errors
        if (!response.ok) {
            let errorMessage = `HTTP Error ${response.status}`;
            // Clone the response to read it multiple times if needed
            const clonedResponse = response.clone();
            try {
                const errorBody = yield clonedResponse.json();
                // Stringify solely for the Error object message
                errorMessage = JSON.stringify(errorBody);
            }
            catch (e) {
                // Fallback if response isn't JSON
                try {
                    errorMessage = (yield response.text()) || errorMessage;
                }
                catch (textError) {
                    // If we can't read text either, use default message
                    errorMessage = `HTTP Error ${response.status}`;
                }
            }
            throw new Error(errorMessage);
        }
        return response.json();
    });
}
/**
 * ==========================================
 * API Methods (Generic)
 * T = Expected return type (defaults to any for backward compatibility)
 * ==========================================
 */
export function apiGet(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "GET",
            headers: getHeaders(),
            credentials: "include"
        });
        return handleRequest(res);
    });
}
export function apiPost(path_1, data_1) {
    return __awaiter(this, arguments, void 0, function* (path, data, requireAuth = false) {
        if (requireAuth && !getToken()) {
            throw new Error("User not authenticated");
        }
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(data),
            credentials: "include"
        });
        return handleRequest(res);
    });
}
export function apiPut(path, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!getToken())
            throw new Error("User not authenticated");
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(data),
            credentials: "include"
        });
        return handleRequest(res);
    });
}
export function apiPatch(path, data) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!getToken())
            throw new Error("User not authenticated");
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "PATCH",
            headers: getHeaders(),
            body: JSON.stringify(data),
            credentials: "include"
        });
        return handleRequest(res);
    });
}
export function apiDelete(path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!getToken())
            throw new Error("User not authenticated");
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "DELETE",
            headers: getHeaders(),
            credentials: "include"
        });
        return handleRequest(res);
    });
}
/**
 * ==========================================
 * Authentication Specific Functions
 * ==========================================
 */
export function login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        // We use direct fetch here because login endpoint might differ in headers logic slightly
        // but we can still reuse handleRequest for response parsing
        const response = yield fetch(`${BASE_URL}/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include"
        });
        try {
            const data = yield handleRequest(response);
            if (data.token) {
                setToken(data.token);
            }
            return data;
        }
        catch (error) {
            let msg = "Login failed";
            try {
                const errObj = JSON.parse(error.message);
                msg = errObj.detail || ((_a = errObj.non_field_errors) === null || _a === void 0 ? void 0 : _a[0]) || msg;
            }
            catch (_b) {
                msg = error.message;
            }
            throw new Error(msg);
        }
    });
}
export function register(username, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`${BASE_URL}/signup/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
            credentials: "include"
        });
        return handleRequest(response);
    });
}
export function logout() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token)
            return;
        try {
            yield fetch(`${BASE_URL}/logout/`, {
                method: "POST",
                headers: getHeaders(),
                credentials: "include"
            });
        }
        catch (error) {
            console.error("Logout error:", error);
        }
        finally {
            removeToken();
        }
    });
}
export function getCurrentUser() {
    return __awaiter(this, void 0, void 0, function* () {
        return apiGet("/user/me/");
    });
}
export function getEvents() {
    return __awaiter(this, void 0, void 0, function* () {
        return apiGet("/events/");
    });
}
export function createEvent(event) {
    return __awaiter(this, void 0, void 0, function* () {
        return apiPost("/events/", event, true);
    });
}
export function getEvent(id) {
    return __awaiter(this, void 0, void 0, function* () {
        return apiGet(`/events/${id}/`);
    });
}
export function updateEvent(id, event) {
    return __awaiter(this, void 0, void 0, function* () {
        return apiPut(`/events/${id}/`, event);
    });
}
export function deleteEvent(id) {
    return __awaiter(this, void 0, void 0, function* () {
        yield apiDelete(`/events/${id}/`);
    });
}
