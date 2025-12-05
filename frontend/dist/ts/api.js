var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const BASE_URL = "http://127.0.0.1:8000/api";
// Token management
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
    return getToken() !== null;
}
// API functions with authentication
export function apiGet(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Token ${token}`;
        }
        const res = yield fetch(`${BASE_URL}${path}`, {
            headers,
            credentials: "include"
        });
        return res.json();
    });
}
export function apiPost(path_1, data_1) {
    return __awaiter(this, arguments, void 0, function* (path, data, requireAuth = false) {
        const token = getToken();
        const headers = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Token ${token}`;
        }
        else if (requireAuth) {
            throw new Error("No autenticado");
        }
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "POST",
            headers,
            body: JSON.stringify(data),
            credentials: "include"
        });
        return res.json();
    });
}
export function apiPut(path, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token) {
            throw new Error("No autenticado");
        }
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        };
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "PUT",
            headers,
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!res.ok) {
            const error = yield res.json();
            throw new Error(JSON.stringify(error));
        }
        return res.json();
    });
}
export function apiPatch(path, data) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token) {
            throw new Error("No autenticado");
        }
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        };
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "PATCH",
            headers,
            body: JSON.stringify(data),
            credentials: "include"
        });
        if (!res.ok) {
            const error = yield res.json();
            throw new Error(JSON.stringify(error));
        }
        return res.json();
    });
}
export function apiDelete(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token) {
            throw new Error("No autenticado");
        }
        const headers = {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        };
        const res = yield fetch(`${BASE_URL}${path}`, {
            method: "DELETE",
            headers,
            credentials: "include"
        });
        if (!res.ok && res.status !== 204) {
            const error = yield res.json();
            throw new Error(JSON.stringify(error));
        }
        return res.status === 204 ? null : res.json();
    });
}
// Authentication functions
export function login(username, password) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const response = yield fetch(`${BASE_URL}/login/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, password }),
            credentials: "include"
        });
        if (!response.ok) {
            const error = yield response.json();
            throw new Error(error.detail || ((_a = error.non_field_errors) === null || _a === void 0 ? void 0 : _a[0]) || "Error al iniciar sesión");
        }
        const data = yield response.json();
        if (data.token) {
            setToken(data.token);
        }
        return data;
    });
}
export function register(username, email, password) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch(`${BASE_URL}/signup/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ username, email, password }),
            credentials: "include"
        });
        if (!response.ok) {
            const error = yield response.json();
            throw new Error(JSON.stringify(error));
        }
        const data = yield response.json();
        return data;
    });
}
export function logout() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token) {
            return;
        }
        try {
            yield fetch(`${BASE_URL}/logout/`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Token ${token}`
                },
                credentials: "include"
            });
        }
        catch (error) {
            console.error("Error al cerrar sesión:", error);
        }
        finally {
            removeToken();
        }
    });
}
export function getCurrentUser() {
    return __awaiter(this, void 0, void 0, function* () {
        const token = getToken();
        if (!token) {
            throw new Error("No autenticado");
        }
        const response = yield fetch(`${BASE_URL}/user/me/`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`
            },
            credentials: "include"
        });
        if (!response.ok) {
            // Intenta leer el cuerpo para obtener detalles del error del servidor (útil en DEBUG)
            let body = '';
            try {
                body = yield response.text();
            }
            catch (e) {
                body = '<no response body available>';
            }
            if (response.status === 401) {
                removeToken();
                throw new Error("Sesión expirada");
            }
            throw new Error(`Error al obtener información del usuario (status ${response.status}): ${body}`);
        }
        return yield response.json();
    });
}
