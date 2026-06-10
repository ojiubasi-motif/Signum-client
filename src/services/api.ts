/**
 * API communication wrapper.
 * JWT is injected from Redux store; never persisted to localStorage/sessionStorage.
 * TODO(security): Switch to HTTPS in production.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

let _token: string | null = null;

/** Called by authSlice after successful login to inject the token into memory. */
export function setApiToken(token: string | null) {
  _token = token;
}

export function getApiToken(): string | null {
  return _token;
}

interface ApiError {
  error: string;
  message?: string;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: ApiError = { error: `HTTP ${res.status}` };
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // response may not be JSON
    }
    throw new Error(body.error || body.message || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/* ─── Public helpers ─────────────────────────────────────────────── */

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
};
