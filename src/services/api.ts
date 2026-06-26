/**
 * API communication wrapper.
 *
 * Security model:
 * - Access token is held in memory via tokenStore (never persisted).
 * - All requests use `credentials: 'include'` so the browser sends
 *   the httpOnly refresh cookie automatically.
 * - Before each authenticated request, `ensureToken()` checks if the
 *   access token is missing or expiring soon. If so, it transparently
 *   calls GET /members/auth/refresh to obtain a fresh token.
 * - On a 401 response, the `auth-expired` event is dispatched so the
 *   AuthInitializer can clear Redux state and show the Login page.
 */

import { tokenStore } from '../lib/tokenStore';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

// Deduplicate concurrent refresh calls — only one in-flight at a time.
let _refreshPromise: Promise<void> | null = null;

/** Attempt a silent token refresh via the httpOnly cookie. */
async function silentRefresh(): Promise<void> {
  const res = await fetch(`${API_BASE}/members/auth/refresh`, {
    method: 'GET',
    credentials: 'include', // browser sends httpOnly cookie automatically
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    tokenStore.clear();
    // Signal to AuthInitializer to show Login page
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-expired'));
    }
    throw new Error('Session expired. Please log in again.');
  }

  const data = await res.json() as { access_token: string };
  tokenStore.set(data.access_token);
}

/**
 * Ensures a valid (non-expiring) access token is in the store.
 * Deduplicates concurrent calls via a shared promise.
 */
async function ensureToken(): Promise<void> {
  if (!tokenStore.shouldRefresh()) return; // token is fresh enough

  if (!_refreshPromise) {
    _refreshPromise = silentRefresh().finally(() => {
      _refreshPromise = null;
    });
  }
  await _refreshPromise;
}

interface ApiError {
  error?: string;
  message?: string;
}

async function request<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {},
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;

  // Proactively refresh the access token if it's missing or close to expiry
  if (!skipAuth) {
    await ensureToken();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string> | undefined),
  };

  const token = tokenStore.get();
  if (token && !skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...fetchOptions,
    credentials: 'include', // needed so refresh cookie is always sent
    headers,
  });

  // Handle 401 — session fully expired (refresh itself failed earlier)
  if (res.status === 401) {
    tokenStore.clear();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auth-expired'));
    }
    let body: ApiError = {};
    try { body = await res.json(); } catch { /* non-JSON */ }
    throw new Error(body.error || body.message || 'Session expired');
  }

  if (!res.ok) {
    let body: ApiError = { error: `HTTP ${res.status}` };
    try { body = await res.json(); } catch { /* non-JSON */ }
    throw new Error(body.error || body.message || `Request failed (${res.status})`);
  }

  return res.json() as Promise<T>;
}

/* ─── Public helpers ─────────────────────────────────────────────── */

export const api = {
  get: <T>(path: string, opts?: { skipAuth?: boolean }) =>
    request<T>(path, { ...opts }),
  post: <T>(path: string, body?: unknown, opts?: { skipAuth?: boolean }) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      ...opts,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
};

/**
 * Called by authSlice after successful OTP verification.
 * Sets the access token in the in-memory store.
 */
export function setApiToken(token: string | null) {
  if (token) {
    tokenStore.set(token);
  } else {
    tokenStore.clear();
  }
}

/** @deprecated Use tokenStore.get() directly. Kept for backward-compat. */
export function getApiToken(): string | null {
  return tokenStore.get();
}
