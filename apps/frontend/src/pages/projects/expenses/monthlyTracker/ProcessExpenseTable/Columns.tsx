import { ColumnDef } from "@tanstack/react-table";

import { EStatementType, statementDocumentOptions } from "common-types/types/expenses";
import { z } from "zod";
import { EditableCell } from "@/components/common/datatable/EditableCell";
import { DataTableColumnHeader } from "@/components/common/datatable/Header";
import { numberFilter } from "@/components/common/datatable/Filters";

//
// ----------------------------------------------------------
// ✅ Types
// ----------------------------------------------------------
//

export type ExpenseRow = {
  id: string;
  amount: number;
  category: string;
  date: string | Date;
  statementType: EStatementType;
  statementRecord: string;
  statementRecordType?: "Perfect" | "May be right" | "Wrong";
  _editing?: boolean;
  _errors?: Record<string, string>;
};

//
// ----------------------------------------------------------
// ✅ Zod row schema (for parent validateRow / validateCell)
// ----------------------------------------------------------
//
export const makeExpenseRowSchema = ({ categories, month, year }) =>
  z.object({
    id: z.string().uuid(),
    amount: z
      .number({
        error: "Amount must be a number",
      })
      .positive("Amount must be greater than 0 or you may delete this record"),

    category: z.string().refine((v) => categories.includes(v), {
      message: "Invalid category",
    }),

    date: z.coerce
      .date()
      .refine((d) => d instanceof Date && !isNaN(d.getTime()), {
        message: "Invalid date",
      })
      .refine(
        (d) => {
          return d.getMonth() === month && d.getFullYear() === year;
        },
        {
          message: "Date outside selected month or year",
        },
      ),

    statementType: z.enum(EStatementType),

    statementRecord: z
      .string()
      .refine((v) => v !== "", { message: "Statement Record cannot be empty" }),

    // statementRecordType: z.enum(["Perfect", "May be right", "Wrong"]).optional(),

    _editing: z.boolean().optional(),
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
      accessorKey: "date",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Date'
          ui='date'
          filter={true}
          sort={true}
        />
      ),
      meta: { width: 60 },
      cell: ({ row, table }) => (
        <EditableCell
          row={row}
          table={table}
          accessor='date'
          ui='date'
          renderView={(v) => new Date(v).toLocaleDateString("en-GB")}
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
          ui='input'
          filter={true}
          sort={true}
        />
      ),
      filterFn: numberFilter,
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
    {
      accessorKey: "category",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Category'
          ui='select'
          options={categories}
          filter={true}
          sort={true}
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
      accessorKey: "statementRecord",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Statement Record'
          ui='input'
          filter={true}
          sort={true}
        />
      ),
      meta: { width: 300 },
      cell: ({ row, table }) => (
        <EditableCell row={row} table={table} accessor='statementRecord' ui='input' />
      ),
    },
    {
      accessorKey: "statementType",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Statement Type'
          ui='select'
          options={statementDocumentOptions}
          filter={true}
          sort={true}
        />
      ),
      meta: { width: 260 },
      cell: ({ row, table }) => (
        <EditableCell
          row={row}
          table={table}
          accessor='statementType'
          ui='select'
          options={statementDocumentOptions}
          renderView={(v) => statementDocumentOptions.find((o) => o.value === v)?.label}
        />
      ),
    },
    // {
    //   accessorKey: "statementRecordType",
    //   header: "Accuracy",
    //   minSize: 200,
    //   cell: ({ row, table }) => (
    //     <EditableCell
    //       row={row}
    //       table={table}
    //       accessor='statementRecordType'
    //       ui='select'
    //       width='w-24'
    //       options={["Perfect", "May be right", "Wrong"]}
    //     />
    //   ),
    // },
  ];
};
