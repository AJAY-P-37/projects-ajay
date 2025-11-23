// src/app/store.js
import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer, { IAuthState } from "./slices/authSlice";
import navReducer, { NavState } from "./slices/navSlice";
import tableReducer, { MultiTableState } from "./slices/tableSlice";
import expensesReducer, { ExpensesState } from "./slices/expensesSlice";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // localStorage
import { logoutAction } from "./actions/globalActions";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

export interface IRootState {
  auth: IAuthState;
  nav: NavState;
  tables: MultiTableState;
  expenses: ExpensesState;
}

const appReducer = combineReducers({
  auth: authReducer,
  nav: navReducer,
  expenses: expensesReducer,
  tables: tableReducer,
});

// ✅ Global reset wrapper
const rootReducer = (state: any, action: any) => {
  if (logoutAction.match(action)) {
    state = undefined; // ✅ resets everything
  }
  return appReducer(state, action);
};

// ✅ Persist config
const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "nav", "tables", "expenses"], // choose what to persist
};

// ✅ Wrap root reducer with persistReducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

// ✅ Store
export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // persist needs this off
    }),
});

// ✅ Persistor
export const persistor = persistStore(store);

// ✅ Types
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = typeof store.dispatch;

// export const useAppDispatch: () => AppDispatch = useDispatch;
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
