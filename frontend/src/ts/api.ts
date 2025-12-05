const BASE_URL = "http://127.0.0.1:8000/api";

// Token management
export function getToken(): string | null {
    return localStorage.getItem('authToken');
}

export function setToken(token: string): void {
    localStorage.setItem('authToken', token);
}

export function removeToken(): void {
    localStorage.removeItem('authToken');
}

export function isAuthenticated(): boolean {
    return getToken() !== null;
}

// API functions with authentication
export async function apiGet(path: string) {
    const token = getToken();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };
    
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        headers,
        credentials: "include"
    });
    return res.json();
}

export async function apiPost(path: string, data: any, requireAuth: boolean = false) {
    const token = getToken();
    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };
    
    if (token) {
        headers["Authorization"] = `Token ${token}`;
    } else if (requireAuth) {
        throw new Error("No autenticado");
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: "include"
    });
    return res.json();
}

export async function apiPut(path: string, data: any) {
    const token = getToken();
    if (!token) {
        throw new Error("No autenticado");
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(data),
        credentials: "include"
    });
    
    if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
    }
    
    return res.json();
}

export async function apiPatch(path: string, data: any) {
    const token = getToken();
    if (!token) {
        throw new Error("No autenticado");
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify(data),
        credentials: "include"
    });
    
    if (!res.ok) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
    }
    
    return res.json();
}

export async function apiDelete(path: string) {
    const token = getToken();
    if (!token) {
        throw new Error("No autenticado");
    }

    const headers: HeadersInit = {
        "Content-Type": "application/json",
        "Authorization": `Token ${token}`
    };

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers,
        credentials: "include"
    });
    
    if (!res.ok && res.status !== 204) {
        const error = await res.json();
        throw new Error(JSON.stringify(error));
    }
    
    return res.status === 204 ? null : res.json();
}

// Authentication functions
export async function login(username: string, password: string): Promise<{ token: string }> {
    const response = await fetch(`${BASE_URL}/login/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include"
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || error.non_field_errors?.[0] || "Error al iniciar sesión");
    }

    const data = await response.json();
    if (data.token) {
        setToken(data.token);
    }
    return data;
}

export async function register(username: string, email: string, password: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/signup/`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
        credentials: "include"
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
    }

    const data = await response.json();
    return data;
}

export async function logout(): Promise<void> {
    const token = getToken();
    if (!token) {
        return;
    }

    try {
        await fetch(`${BASE_URL}/logout/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Token ${token}`
            },
            credentials: "include"
        });
    } catch (error) {
        console.error("Error al cerrar sesión:", error);
    } finally {
        removeToken();
    }
}

export async function getCurrentUser(): Promise<{ id: number; username: string; email: string }> {
    const token = getToken();
    if (!token) {
        throw new Error("No autenticado");
    }

    const response = await fetch(`${BASE_URL}/user/me/`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`
        },
        credentials: "include"
    });

    if (!response.ok) {
        // Intenta leer el cuerpo para obtener detalles del error del servidor (útil en DEBUG)
        let body: string = '';
        try {
            body = await response.text();
        } catch (e) {
            body = '<no response body available>';
        }

        if (response.status === 401) {
            removeToken();
            throw new Error("Sesión expirada");
        }

        throw new Error(`Error al obtener información del usuario (status ${response.status}): ${body}`);
    }

    return await response.json();
}
