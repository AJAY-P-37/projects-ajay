import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { EditableCell } from "@/components/common/datatable/EditableCell";
import { DataTableColumnHeader } from "@/components/common/datatable/Header";

//
// ----------------------------------------------------------
// ✅ Types
// ----------------------------------------------------------
//

export type ExpenseRow = {
  id: string;
  category: string;
  amount: number;
  _editing?: boolean;
  _errors?: Record<string, string>;
};

//
// ----------------------------------------------------------
// ✅ Zod row schema (for parent validateRow / validateCell)
// ----------------------------------------------------------
//
export const makeExpenseRowSchema = ({ categories }) =>
  z.object({
    id: z.string().uuid(),
    category: z.string().refine((v) => v === "Total" || categories.includes(v), {
      message: "Invalid category",
    }),
    amount: z.number({
      error: "Amount must be a number",
    }),

    // _editing: z.boolean().optional(),
  });

//
// ----------------------------------------------------------
// ✅ Columns
// ----------------------------------------------------------
//
export const expenseColumns = ({
  categories,
}: {
  categories: string[];
}): ColumnDef<ExpenseRow>[] => {
  return [
    {
      accessorKey: "category",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Category'
          ui='select'
        />
      ),
      meta: { width: 150 },
      cell: ({ row, table }) => (
        <EditableCell
          row={row}
          table={table}
          accessor='category'
          ui='select'
          options={categories}
        />
      ),
    },
    {
      accessorKey: "amount",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Amount'
          ui='number'
        />
      ),
      meta: { width: 130 },
      cell: ({ row, table }) => (
        <EditableCell
          row={row}
          table={table}
          accessor='amount'
          ui='number'
          renderView={(v) => `₹${v}`}
        />
      ),
    },
  ];
};
