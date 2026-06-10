import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Member, AuthResponse } from '../../types';
import { api, setApiToken } from '../../services/api';

interface AuthState {
  token: string | null;
  member: Member | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  token: null,
  member: null,
  loading: false,
  error: null,
};

/** Register / login — POST /members/register */
export const loginMember = createAsyncThunk<
  AuthResponse,
  string, // whatsappNumber
  { rejectValue: string }
>('auth/login', async (whatsappNumber, { rejectWithValue }) => {
  try {
    const data = await api.post<AuthResponse>('/members/register', {
      whatsappNumber,
    });
    // Inject token into API layer memory (never localStorage)
    setApiToken(data.token);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Login failed';
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
      setApiToken(null);
    },
    clearError(state) {
      state.error = null;
    },
    /** Manually set token (e.g. from a refresh flow) */
    setToken(state, action: PayloadAction<string>) {
      state.token = action.payload;
      setApiToken(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginMember.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginMember.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.member = action.payload.member;
      })
      .addCase(loginMember.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { logout, clearError, setToken } = authSlice.actions;
export default authSlice.reducer;
