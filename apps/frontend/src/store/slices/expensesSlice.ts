// src/store/slices/expensesSlice.ts
import {
  currentMonth,
  currentYear,
} from "@/pages/projects/expenses/monthlyTracker/MonthlyExpensesFormSchema";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ExpensesState {
  formValues: {
    month: string;
    year: string;
    statements: Array<{ type: string; file: File[] | [] }>;
  };
  categories: any[];
}

const initialState: ExpensesState = {
  formValues: {
    month: currentMonth,
    year: currentYear,
    statements: [{ type: "", file: [] }],
  },
  categories: [],
};

const expensesSlice = createSlice({
  name: "expenses",
  initialState,
  reducers: {
    setCategories(state, action: PayloadAction<any[]>) {
      state.categories = action.payload;
    },
    setMonthlyExpensesForm(
      state,
      action: PayloadAction<{
        month: string;
        year: string;
        statements: Array<{ type: string; file: File[] }>;
      }>,
    ) {
      const { month, year, statements } = action.payload;
      const s = statements.map((s) => {
        return { ...s, file: URL.createObjectURL(s.file[0]) as unknown as File[] };
      });
      state.formValues = { month, year, statements: s };
    },
  },
});

export const { setCategories, setMonthlyExpensesForm } = expensesSlice.actions;

export default expensesSlice.reducer;
