import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { EditableCell } from "@/components/common/datatable/EditableCell";
import { DataTableColumnHeader } from "@/components/common/datatable/Header";

// ----------------------------------------------------------
// ✅ Types
// ----------------------------------------------------------
export type IncomeSourceRow = {
  id: string;
  source: string;
  description?: string;
  _editing?: boolean;
  _errors?: Record<string, string>;
};

// ----------------------------------------------------------
// ✅ Zod row schema
// ----------------------------------------------------------
export const makeIncomeSourceRowSchema = () =>
  z.object({
    id: z.string().uuid(),
    source: z.string().refine((v) => v.trim() !== "", { message: "Source cannot be empty" }),
    description: z.string().optional(),
    _editing: z.boolean().optional(),
  });

// ----------------------------------------------------------
// ✅ Columns
// ----------------------------------------------------------
export const incomeSourceColumns = (): ColumnDef<IncomeSourceRow>[] => {
  return [
    {
      accessorKey: "source",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Income Source'
          ui='input'
        />
      ),
      meta: { width: 220 },
      cell: ({ row, table }) => (
        <EditableCell row={row} table={table} accessor='source' ui='input' />
      ),
    },
    {
      accessorKey: "description",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Description'
          ui='input'
        />
      ),
      meta: { width: 350 },
      cell: ({ row, table }) => (
        <EditableCell row={row} table={table} accessor='description' ui='input' />
      ),
    },
  ];
};
