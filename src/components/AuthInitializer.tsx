import { useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadProfile, clearAuth } from '../store/slices/authSlice';

/**
 * AuthInitializer
 *
 * Mounts once at the top of the React tree (inside <Provider>).
 * Responsibilities:
 *  1. On mount, dispatches `loadProfile` to silently restore the session
 *     via the httpOnly cookie — no user interaction required.
 *  2. Listens for the `auth-expired` window event (dispatched by api.ts
 *     on a 401 response) and clears Redux auth state.
 *  3. Schedules a proactive token refresh 60 s before the access token
 *     expires, preventing 401s during active use.
 *
 * This component renders nothing — it is purely behavioural.
 */
export default function AuthInitializer() {
  const dispatch = useAppDispatch();
  const expiresAt = useAppSelector((s) => s.auth.expiresAt);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- 1. Silent restore on mount ---
  useEffect(() => {
    dispatch(loadProfile());
  }, [dispatch]);

  // --- 2. Listen for auth-expired events from api.ts ---
  useEffect(() => {
    function onAuthExpired() {
      dispatch(clearAuth());
    }
    window.addEventListener('auth-expired', onAuthExpired);
    return () => window.removeEventListener('auth-expired', onAuthExpired);
  }, [dispatch]);

  // --- 3. Proactive refresh 60 s before expiry ---
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (!expiresAt) return;

    const delay = expiresAt - Date.now() - 60_000; // 60 s before expiry
    if (delay <= 0) {
      // Token already expiring — refresh immediately
      dispatch(loadProfile());
      return;
    }

    timerRef.current = setTimeout(() => {
      dispatch(loadProfile());
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dispatch, expiresAt]);

  return null;
}
