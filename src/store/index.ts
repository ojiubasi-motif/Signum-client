import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import signalsReducer from './slices/signalsSlice';
import portfolioReducer from './slices/portfolioSlice';
import adminsReducer from './slices/adminsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    signals: signalsReducer,
    portfolio: portfolioReducer,
    admins: adminsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
