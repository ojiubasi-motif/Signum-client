import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { Admin } from '../../types';
import { api } from '../../services/api';

interface AdminsState {
  list: Admin[];
  loading: boolean;
  error: string | null;
}

const initialState: AdminsState = {
  list: [],
  loading: false,
  error: null,
};

/** GET /admins/stats */
export const fetchAdminStats = createAsyncThunk<
  Admin[],
  void,
  { rejectValue: string }
>('admins/fetchStats', async (_, { rejectWithValue }) => {
  try {
    return await api.get<Admin[]>('/admins/stats');
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load leaderboard',
    );
  }
});

const adminsSlice = createSlice({
  name: 'admins',
  initialState,
  reducers: {
    clearAdmins(state) {
      state.list = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      });
  },
});

export const { clearAdmins } = adminsSlice.actions;
export default adminsSlice.reducer;
