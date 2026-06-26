/**
 * In-memory access token store.
 *
 * Access tokens are kept ONLY in JavaScript memory — never in
 * localStorage, sessionStorage, or any persistent store.
 * This prevents XSS token exfiltration.
 *
 * On page refresh the store is empty; the AuthInitializer triggers
 * a silent refresh via the httpOnly cookie to restore the session.
 */

interface TokenPayload {
  memberId: string;
  whatsappNumber: string;
  exp: number;
  iat: number;
}

let _accessToken: string | null = null;
let _payload: TokenPayload | null = null;

/** Decode a JWT without verifying signature (verification is server-side). */
function decodeJwt(token: string): TokenPayload | null {
  try {
    const [, payloadB64] = token.split('.');
    const json = atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json) as TokenPayload;
  } catch {
    return null;
  }
}

export const tokenStore = {
  /** Store a new access token and decode its payload. */
  set(token: string): void {
    _accessToken = token;
    _payload = decodeJwt(token);
  },

  /** Retrieve the current access token (null if not set or cleared). */
  get(): string | null {
    return _accessToken;
  },

  /** True if a token is currently held. */
  hasToken(): boolean {
    return _accessToken !== null;
  },

  /** Return expiry time in ms (epoch), or null if unknown. */
  getExpiryMs(): number | null {
    return _payload ? _payload.exp * 1000 : null;
  },

  /**
   * Returns true if the token is missing or expires within the
   * next `windowMs` milliseconds (default: 60 s).
   */
  shouldRefresh(windowMs = 60_000): boolean {
    if (!_accessToken) return true;
    const expiry = this.getExpiryMs();
    if (!expiry) return true;
    return Date.now() >= expiry - windowMs;
  },

  /** Decoded member info from the token payload. */
  getMemberId(): string | null {
    return _payload?.memberId ?? null;
  },

  getWhatsappNumber(): string | null {
    return _payload?.whatsappNumber ?? null;
  },

  /** Clear all token state (called on logout or 401). */
  clear(): void {
    _accessToken = null;
    _payload = null;
  },
};
