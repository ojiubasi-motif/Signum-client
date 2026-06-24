import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Member, AuthResponse } from '../../types';
import { api, setApiToken } from '../../services/api';

interface AuthState {
  token: string | null;
  member: Member | null;
  loading: boolean;
  error: string | null;
  step: 'phone' | 'otp';
  whatsappNumber: string | null;
}

const initialState: AuthState = {
  token: null,
  member: null,
  loading: false,
  error: null,
  step: 'phone',
  whatsappNumber: null,
};

/** Request OTP - POST /members/request-otp */
export const requestOtp = createAsyncThunk<
  { message: string; whatsappNumber: string },
  string, // whatsappNumber
  { rejectValue: string }
>('auth/requestOtp', async (whatsappNumber, { rejectWithValue }) => {
  try {
    const data = await api.post<{ message: string }>('/members/request-otp', {
      whatsappNumber,
    });
    return { ...data, whatsappNumber };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to send verification code';
    return rejectWithValue(message);
  }
});

/** Verify OTP - POST /members/verify-otp */
export const verifyOtp = createAsyncThunk<
  AuthResponse,
  { whatsappNumber: string; code: string },
  { rejectValue: string }
>('auth/verifyOtp', async ({ whatsappNumber, code }, { rejectWithValue }) => {
  try {
    const data = await api.post<AuthResponse>('/members/verify-otp', {
      whatsappNumber,
      code,
    });
    // Inject token into API layer memory
    setApiToken(data.token);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Verification failed';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.token = null;
      state.member = null;
      state.error = null;
      state.step = 'phone';
      state.whatsappNumber = null;
      setApiToken(null);
    },
    clearError(state) {
      state.error = null;
    },
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      setApiToken(action.payload);
    },
    resetLoginFlow(state) {
      state.step = 'phone';
      state.whatsappNumber = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // requestOtp
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
      // verifyOtp
      .addCase(verifyOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.member = action.payload.member;
        state.step = 'phone';
        state.whatsappNumber = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Verification failed';
      });
  },
});

export const { logout, clearError, setToken, resetLoginFlow } = authSlice.actions;
export default authSlice.reducer;
