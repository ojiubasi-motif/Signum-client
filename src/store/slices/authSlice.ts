import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Member, AuthResponse } from '../../types';
import { api, setApiToken } from '../../services/api';
import { tokenStore } from '../../lib/tokenStore';

interface AuthState {
  /** true once the silent-restore attempt has completed (success or failure). */
  initialized: boolean;
  /** true while a login or profile-load request is in-flight. */
  loading: boolean;
  member: Member | null;
  error: string | null;
  step: 'phone' | 'otp';
  whatsappNumber: string | null;
  /** Epoch ms when the current access token expires (for proactive refresh scheduling). */
  expiresAt: number | null;
}

const initialState: AuthState = {
  initialized: false,
  loading: false,
  member: null,
  error: null,
  step: 'phone',
  whatsappNumber: null,
  expiresAt: null,
};

/* ─── Async Thunks ─────────────────────────────────────────────────── */

/** Request OTP — POST /members/request-otp */
export const requestOtp = createAsyncThunk<
  { message: string; whatsappNumber: string },
  string,
  { rejectValue: string }
>('auth/requestOtp', async (whatsappNumber, { rejectWithValue }) => {
  try {
    const data = await api.post<{ message: string }>('/members/request-otp', {
      whatsappNumber,
    }, { skipAuth: true });
    return { ...data, whatsappNumber };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send verification code';
    return rejectWithValue(message);
  }
});

/** Verify OTP — POST /members/verify-otp */
export const verifyOtp = createAsyncThunk<
  AuthResponse,
  { whatsappNumber: string; code: string },
  { rejectValue: string }
>('auth/verifyOtp', async ({ whatsappNumber, code }, { rejectWithValue }) => {
  try {
    const data = await api.post<AuthResponse>('/members/verify-otp', {
      whatsappNumber,
      code,
    }, { skipAuth: true });
    // Store the access token in memory (never in localStorage)
    setApiToken(data.access_token);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return rejectWithValue(message);
  }
});

/**
 * Silent session restore — called on every page load.
 * Hits GET /members/me (which internally triggers a silent refresh
 * via the httpOnly cookie if the access token is missing/expired).
 */
export const loadProfile = createAsyncThunk<
  { member: Member; expiresAt: number | null },
  void,
  { rejectValue: string }
>('auth/loadProfile', async (_, { rejectWithValue }) => {
  try {
    const data = await api.get<{ member: Member }>('/members/me');
    return { member: data.member, expiresAt: tokenStore.getExpiryMs() };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Session restore failed';
    return rejectWithValue(message);
  }
});

/**
 * Secure logout — revokes the refresh token on the server,
 * which also clears the httpOnly cookie.
 */
export const logoutUser = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await api.post('/members/auth/logout');
    } catch (err: unknown) {
      // Even if the server call fails, clear client state
      const message = err instanceof Error ? err.message : 'Logout failed';
      return rejectWithValue(message);
    } finally {
      tokenStore.clear();
    }
  },
);

/* ─── Slice ────────────────────────────────────────────────────────── */

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** Immediately clear auth state — called when 'auth-expired' event fires. */
    clearAuth(state) {
      state.initialized = true;
      state.member = null;
      state.error = null;
      state.step = 'phone';
      state.whatsappNumber = null;
      state.expiresAt = null;
      tokenStore.clear();
    },
    clearError(state) {
      state.error = null;
    },
    resetLoginFlow(state) {
      state.step = 'phone';
      state.whatsappNumber = null;
      state.error = null;
    },
    /** @deprecated kept for backwards-compat; use logoutUser thunk. */
    logout(state) {
      state.initialized = true;
      state.member = null;
      state.error = null;
      state.step = 'phone';
      state.whatsappNumber = null;
      state.expiresAt = null;
      tokenStore.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      /* requestOtp */
      .addCase(requestOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(requestOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.step = 'otp';
        state.whatsappNumber = action.payload.whatsappNumber;
      })
      .addCase(requestOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Failed to send OTP';
      })

      /* verifyOtp */
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.member = action.payload.member;
        state.expiresAt = tokenStore.getExpiryMs();
        state.step = 'phone';
        state.whatsappNumber = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Verification failed';
      })

      /* loadProfile (silent restore on page load) */
      .addCase(loadProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.initialized = true;
        state.member = action.payload.member;
        state.expiresAt = action.payload.expiresAt;
      })
      .addCase(loadProfile.rejected, (state) => {
        // Restore failed (no valid cookie) — show Login page
        state.loading = false;
        state.initialized = true;
        state.member = null;
      })

      /* logoutUser */
      .addCase(logoutUser.fulfilled, (state) => {
        state.initialized = true;
        state.member = null;
        state.error = null;
        state.step = 'phone';
        state.whatsappNumber = null;
        state.expiresAt = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Still clear local state even if server call failed
        state.initialized = true;
        state.member = null;
        state.expiresAt = null;
      });
  },
});

export const { clearAuth, clearError, resetLoginFlow, logout } = authSlice.actions;
export default authSlice.reducer;
