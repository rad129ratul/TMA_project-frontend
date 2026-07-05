const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

export function getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
}

export function clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function refreshAccessToken(): Promise<string | null> {
    const refresh = getRefreshToken();
    if (!refresh) return null;

    const res = await fetch(`${API_BASE_URL}/api/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    localStorage.setItem(ACCESS_TOKEN_KEY, data.access);
    return data.access;
}

interface ApiOptions extends RequestInit {
    skipAuth?: boolean;
}

export async function apiFetch(path: string, options: ApiOptions = {}) {
    const { skipAuth, headers, ...rest } = options;

    const buildHeaders = (token: string | null) => ({
        "Content-Type": "application/json",
        ...(token && !skipAuth ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
    });

    let token = getAccessToken();

    let res = await fetch(`${API_BASE_URL}${path}`, {
        ...rest,
        headers: buildHeaders(token),
    });

    // Access token expired → try refresh once
    if (res.status === 401 && !skipAuth) {
        const newToken = await refreshAccessToken();
        if (newToken) {
            res = await fetch(`${API_BASE_URL}${path}`, {
                ...rest,
                headers: buildHeaders(newToken),
            });
        } else {
            clearTokens();
            if (typeof window !== "undefined") {
                window.location.href = "/login";
            }
        }
    }

    return res;
}