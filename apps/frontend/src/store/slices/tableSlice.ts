// src/store/slices/tableSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface SingleTableState<T = any> {
  name: string;
  data: T[];
}

export interface MultiTableState {
  tables: Record<string, SingleTableState>;
}

const initialState: MultiTableState = {
  tables: {},
};

const tableSlice = createSlice({
  name: "tables",
  initialState,
  reducers: {
    // Create or fully replace a table
    setTable<T>(state, action: PayloadAction<{ id: string; name: string; data: T[] }>) {
      const { id, name, data } = action.payload;
      state.tables[id] = { name, data };
    },

    // Only update name
    setTableName(state, action: PayloadAction<{ id: string; name: string }>) {
      const { id, name } = action.payload;
      if (!state.tables[id]) return;
      state.tables[id].name = name;
    },

    // Only update data
    setTableData<T>(state, action: PayloadAction<{ id: string; data: T[] }>) {
      const { id, data } = action.payload;
      if (!state.tables[id]) return;
      state.tables[id].data = data;
    },

    // Delete a single table
    deleteTable(state, action: PayloadAction<string>) {
      delete state.tables[action.payload];
    },

    // Reset everything
    resetAllTables(state) {
      state.tables = {};
    },
  },
});

export const { setTable, setTableName, setTableData, deleteTable, resetAllTables } =
  tableSlice.actions;

export default tableSlice.reducer;
