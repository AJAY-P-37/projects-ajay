// src/app/store.js
import { configureStore } from "@reduxjs/toolkit";
import authReducer, { IAuthState } from "./slices/authSlice";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export interface IRootState {
  auth: IAuthState;
}
export const store = configureStore({
  reducer: {
    auth: authReducer,
    // Add other reducers here
  },
});

// ✅ Typed versions of dispatch and state
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// export const useAppDispatch: () => AppDispatch = useDispatch;
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
