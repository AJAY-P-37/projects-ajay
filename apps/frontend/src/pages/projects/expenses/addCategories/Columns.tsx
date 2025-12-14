import { ColumnDef } from "@tanstack/react-table";
import { z } from "zod";
import { EditableCell } from "@/components/common/datatable/EditableCell";
import { DataTableColumnHeader } from "@/components/common/datatable/Header";
import { Tags } from "@/components/common/storybook/tagEditor";

//
// ----------------------------------------------------------
// ✅ Types
// ----------------------------------------------------------
//

export type CategoryRow = {
  id: string;
  category: string;
  keywords: string[];
  _editing?: boolean;
  _errors?: Record<string, string>;
};

//
// ----------------------------------------------------------
// ✅ Zod row schema (for parent validateRow / validateCell)
// ----------------------------------------------------------
//
export const makeCategoriesRowSchema = () =>
  z.object({
    id: z.string().uuid(),
    category: z.string().refine((v) => v !== "", { message: "Category cannot be empty" }),

    keywords: z.array(z.string()).min(1, "At least one keyword is required"),
  });

//
// ----------------------------------------------------------
// ✅ Columns
// ----------------------------------------------------------
//
export const categoriesColumns = (): ColumnDef<CategoryRow>[] => {
  return [
    {
      accessorKey: "category",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Category'
          ui='input'
        />
      ),
      meta: { width: 150 },
      cell: ({ row, table }) => (
        <EditableCell row={row} table={table} accessor='category' ui='input' />
      ),
    },
    {
      accessorKey: "keywords",
      header: ({ column, table, header }) => (
        <DataTableColumnHeader
          column={column}
          table={table}
          header={header}
          title='Keywords'
          ui='tagEditor'
        />
      ),
      meta: { width: 230 },
      cell: ({ row, table }) => (
        <EditableCell
          row={row}
          table={table}
          accessor='keywords'
          ui='tagEditor'
          renderView={(value: string[]) => {
            if (value.length === 0) return "\u00A0";
            return <Tags tags={value} isRemovable={false} />;
          }}
        />
      ),
    },
  ];
};
