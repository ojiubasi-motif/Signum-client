import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '.';

/** Pre-typed dispatch for async thunks */
export const useAppDispatch = () => useDispatch<AppDispatch>();

/** Pre-typed selector for strong inference */
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
