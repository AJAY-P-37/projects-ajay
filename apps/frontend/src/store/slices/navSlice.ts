// src/store/slices/navSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface NavState {
  heading: string;
}

const initialState: NavState = {
  heading: "Home", // default heading
};

const navSlice = createSlice({
  name: "nav",
  initialState,
  reducers: {
    setHeading: (state, action: PayloadAction<string>) => {
      state.heading = action.payload;
    },
  },
});

export const { setHeading } = navSlice.actions;
export default navSlice.reducer;
