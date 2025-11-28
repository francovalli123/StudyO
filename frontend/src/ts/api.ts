const BASE_URL = "http://127.0.0.1:8000/api";

export async function apiGet(path: string) {
    const res = await fetch(`${BASE_URL}${path}`, {
        credentials: "include"
    });
    return res.json();
}

export async function apiPost(path: string, data: any) {
    const res = await fetch(`${BASE_URL}${path}`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(data),
        credentials: "include"
    });
    return res.json();
}
