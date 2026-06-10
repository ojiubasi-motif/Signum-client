import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Signal } from '../../types';
import { api } from '../../services/api';

interface SignalsState {
  active: Signal[];
  history: Signal[];
  loadingActive: boolean;
  loadingHistory: boolean;
  error: string | null;
}

const initialState: SignalsState = {
  active: [],
  history: [],
  loadingActive: false,
  loadingHistory: false,
  error: null,
};

/** GET /signals/active */
export const fetchActiveSignals = createAsyncThunk<
  Signal[],
  void,
  { rejectValue: string }
>('signals/fetchActive', async (_, { rejectWithValue }) => {
  try {
    return await api.get<Signal[]>('/signals/active');
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load signals',
    );
  }
});

/** GET /signals/history */
export const fetchSignalHistory = createAsyncThunk<
  Signal[],
  void,
  { rejectValue: string }
>('signals/fetchHistory', async (_, { rejectWithValue }) => {
  try {
    return await api.get<Signal[]>('/signals/history');
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load history',
    );
  }
});

const signalsSlice = createSlice({
  name: 'signals',
  initialState,
  reducers: {
    clearSignals(state) {
      state.active = [];
      state.history = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Active
      .addCase(fetchActiveSignals.pending, (state) => {
        state.loadingActive = true;
        state.error = null;
      })
      .addCase(fetchActiveSignals.fulfilled, (state, action) => {
        state.loadingActive = false;
        state.active = action.payload;
      })
      .addCase(fetchActiveSignals.rejected, (state, action) => {
        state.loadingActive = false;
        state.error = action.payload ?? 'Unknown error';
      })
      // History
      .addCase(fetchSignalHistory.pending, (state) => {
        state.loadingHistory = true;
        state.error = null;
      })
      .addCase(fetchSignalHistory.fulfilled, (state, action) => {
        state.loadingHistory = false;
        state.history = action.payload;
      })
      .addCase(fetchSignalHistory.rejected, (state, action) => {
        state.loadingHistory = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearSignals } = signalsSlice.actions;
export default signalsSlice.reducer;
