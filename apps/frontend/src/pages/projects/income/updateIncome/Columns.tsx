import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { EditableCell } from "@/components/common/datatable/EditableCell";
import { DataTableColumnHeader } from "@/components/common/datatable/Header";
import { numberFilter } from "@/components/common/datatable/Filters";
import { incomeSourceOptions } from "common-types/types/expenses";

// ----------------------------------------------------------
// ✅ Types
// ----------------------------------------------------------
export type IncomeRow = {
  id: string;
  date: string | Date;
  source: string;
  amount: number;
  note: string;
  _editing?: boolean;
  _draft?: Omit<IncomeRow, "_draft">;
};

// ----------------------------------------------------------
// ✅ Zod row schema
// ----------------------------------------------------------
export const makeIncomeRowSchema = ({
  sources,
  month,
  year,
}: {
  sources: string[];
  month: number;
  year: number;
}) => {
  return z.object({
    id: z.string().uuid(),

    amount: z
      .number({ error: "Amount must be a number" })
      .positive("Amount must be greater than 0"),

    source: z.string().refine((v) => sources.includes(v), {
      message: "Invalid source. Please select or add it in Income Sources",
    }),

    date: z.coerce
      .date()
      .refine((d) => d instanceof Date && !isNaN(d.getTime()), {
        message: "Invalid date",
      })
      .refine(
        (d) => d.getMonth() === month && d.getFullYear() === year,
        {
          message: `Date must fall within ${new Date(year, month).toLocaleString("en-US", { month: "long" })} ${year}`,
        },
      ),

    note: z.string().optional(),

    _editing: z.boolean().optional(),
  });
};

// ----------------------------------------------------------
// ✅ Columns
// ----------------------------------------------------------
export const incomeColumns = ({
  sources,
}: {
  sources: string[];
}): ColumnDef<IncomeRow>[] => [
  {
    accessorKey: "date",
    header: ({ column, table, header }) => (
      <DataTableColumnHeader
        column={column}
        table={table}
        header={header}
        title="Date"
        ui="date"
        filter={true}
        sort={true}
      />
    ),
    meta: { width: 60 },
    cell: ({ row, table }) => (
      <EditableCell
        row={row}
        table={table}
        accessor="date"
        ui="date"
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
        title="Amount"
        ui="input"
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
        accessor="amount"
        ui="number"
        renderView={(v) => `₹${v}`}
      />
    ),
  },
  {
    accessorKey: "source",
    header: ({ column, table, header }) => (
      <DataTableColumnHeader
        column={column}
        table={table}
        header={header}
        title="Source"
        ui="select"
        options={sources}
        filter={true}
        sort={true}
      />
    ),
    meta: { width: 200 },
    cell: ({ row, table }) => (
      <EditableCell
        row={row}
        table={table}
        accessor="source"
        ui="select"
        options={sources}
      />
    ),
  },
  {
    accessorKey: "note",
    header: ({ column, table, header }) => (
      <DataTableColumnHeader
        column={column}
        table={table}
        header={header}
        title="Note"
        ui="input"
        filter={true}
        sort={false}
      />
    ),
    meta: { width: 300 },
    cell: ({ row, table }) => (
      <EditableCell row={row} table={table} accessor="note" ui="input" />
    ),
  },
];
