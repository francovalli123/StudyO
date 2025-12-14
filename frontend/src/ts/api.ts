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
function getHeaders(contentType: string = "application/json"): HeadersInit {
    const headers: Record<string, string> = {
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
async function handleRequest<T>(response: Response): Promise<T> {
    // Handle 401 Unauthorized globally
    if (response.status === 401) {
        removeToken();
        // Optional: You could trigger a page reload or redirect here
        throw new Error("Session expired. Please login again.");
    }

    // Handle 204 No Content (common in DELETE or empty PUTs)
    if (response.status === 204) {
        return null as T;
    }

    // Handle standard errors
    if (!response.ok) {
        let errorMessage = `HTTP Error ${response.status}`;
        // Clone the response to read it multiple times if needed
        const clonedResponse = response.clone();
        try {
            const errorBody = await clonedResponse.json();
            // Stringify solely for the Error object message
            errorMessage = JSON.stringify(errorBody);
        } catch (e) {
            // Fallback if response isn't JSON
            try {
                errorMessage = await response.text() || errorMessage;
            } catch (textError) {
                // If we can't read text either, use default message
                errorMessage = `HTTP Error ${response.status}`;
            }
        }
        throw new Error(errorMessage);
    }

    return response.json();
}

/**
 * ==========================================
 * API Methods (Generic)
 * T = Expected return type (defaults to any for backward compatibility)
 * ==========================================
 */

export async function apiGet<T = any>(path: string): Promise<T> {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "GET",
        headers: getHeaders(),
        credentials: "include"
    });
    return handleRequest<T>(res);
}

export async function apiPost<T = any>(path: string, data: any, requireAuth: boolean = false): Promise<T> {
    if (requireAuth && !getToken()) {
        throw new Error("User not authenticated");
    }

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: "include"
    });
    return handleRequest<T>(res);
}

export async function apiPut<T = any>(path: string, data: any): Promise<T> {
    if (!getToken()) throw new Error("User not authenticated");

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: "include"
    });
    return handleRequest<T>(res);
}

export async function apiPatch<T = any>(path: string, data: any): Promise<T> {
    if (!getToken()) throw new Error("User not authenticated");

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(data),
        credentials: "include"
    });
    return handleRequest<T>(res);
}

export async function apiDelete<T = any>(path: string): Promise<T | null> {
    if (!getToken()) throw new Error("User not authenticated");

    const res = await fetch(`${BASE_URL}${path}`, {
        method: "DELETE",
        headers: getHeaders(),
        credentials: "include"
    });
    return handleRequest<T>(res);
}

/**
 * ==========================================
 * Authentication Specific Functions
 * ==========================================
 */

export async function login(username: string, password: string): Promise<{ token: string }> {
    // We use direct fetch here because login endpoint might differ in headers logic slightly
    // but we can still reuse handleRequest for response parsing
    const response = await fetch(`${BASE_URL}/login/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include"
    });

    try {
        const data = await handleRequest<{ token: string }>(response);
        if (data.token) {
            setToken(data.token);
        }
        return data;
    } catch (error: any) {
        let msg = "Login failed";
        try {
            const errObj = JSON.parse(error.message);
            msg = errObj.detail || errObj.non_field_errors?.[0] || msg;
        } catch {
            msg = error.message; 
        }
        throw new Error(msg);
    }
}

export async function register(username: string, email: string, password: string): Promise<any> {
    const response = await fetch(`${BASE_URL}/signup/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
        credentials: "include"
    });
    return handleRequest(response);
}

export async function logout(): Promise<void> {
    const token = getToken();
    if (!token) return;

    try {
        await fetch(`${BASE_URL}/logout/`, {
            method: "POST",
            headers: getHeaders(),
            credentials: "include"
        });
    } catch (error) {
        console.error("Logout error:", error);
    } finally {
        removeToken();
    }
}

export async function getCurrentUser(): Promise<{ id: number; username: string; email: string }> {
    return apiGet<{ id: number; username: string; email: string }>("/user/me/");
}

/**
 * ==========================================
 * Subject Interface
 * ==========================================
 */

export interface Subject {
    id: number;
    name: string;
    priority?: number | null;
    color?: string | null;
    progress?: number;
    next_exam_date?: string | null;
    professor_name?: string | null;
}

/**
 * ==========================================
 * Events API Functions
 * ==========================================
 */

export interface Event {
    id?: number;
    title: string;
    date: string;
    type: number;
    type_display?: string;
    start_time: string;
    end_time: string;
    subject: number | null;
    notes?: string | null;
    created_at?: string;
    updated_at?: string;
}

export async function getEvents(): Promise<Event[]> {
    return apiGet<Event[]>("/events/");
}

export async function createEvent(event: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'type_display'>): Promise<Event> {
    return apiPost<Event>("/events/", event, true);
}

export async function getEvent(id: number): Promise<Event> {
    return apiGet<Event>(`/events/${id}/`);
}

export async function updateEvent(id: number, event: Partial<Event>): Promise<Event> {
    return apiPut<Event>(`/events/${id}/`, event);
}

export async function deleteEvent(id: number): Promise<void> {
    await apiDelete(`/events/${id}/`);
}