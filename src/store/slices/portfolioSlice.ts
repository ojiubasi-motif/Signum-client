import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PortfolioResponse } from '../../types';
import { api } from '../../services/api';

interface PortfolioState {
  data: PortfolioResponse | null;
  loading: boolean;
  error: string | null;
  takingTradeId: string | null; // signalId currently being taken
}

const initialState: PortfolioState = {
  data: null,
  loading: false,
  error: null,
  takingTradeId: null,
};

/** GET /members/:id/portfolio */
export const fetchPortfolio = createAsyncThunk<
  PortfolioResponse,
  string, // memberId
  { rejectValue: string }
>('portfolio/fetch', async (memberId, { rejectWithValue }) => {
  try {
    return await api.get<PortfolioResponse>(`/members/${encodeURIComponent(memberId)}/portfolio`);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to load portfolio',
    );
  }
});

/** POST /members/trade/:signalId */
export const takeTrade = createAsyncThunk<
  { message: string },
  string, // signalId
  { rejectValue: string }
>('portfolio/takeTrade', async (signalId, { rejectWithValue }) => {
  try {
    return await api.post<{ message: string }>(`/members/trade/${encodeURIComponent(signalId)}`);
  } catch (err: unknown) {
    return rejectWithValue(
      err instanceof Error ? err.message : 'Failed to register trade',
    );
  }
});

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    clearPortfolio(state) {
      state.data = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? 'Unknown error';
      })
      .addCase(takeTrade.pending, (state, action) => {
        state.takingTradeId = action.meta.arg;
      })
      .addCase(takeTrade.fulfilled, (state) => {
        state.takingTradeId = null;
      })
      .addCase(takeTrade.rejected, (state) => {
        state.takingTradeId = null;
      });
  },
});

export const { clearPortfolio } = portfolioSlice.actions;
export default portfolioSlice.reducer;
