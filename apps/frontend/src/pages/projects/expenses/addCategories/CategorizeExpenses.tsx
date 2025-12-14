import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { DataTable } from "@/components/common/datatable/DataTable";
import { categoriesColumns, makeCategoriesRowSchema } from "./Columns";
import { ZodObject } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import ExpensesService from "@/services/ExpensesService";
import { useQuery } from "@tanstack/react-query";
import { IExpensesCategory } from "common-types/types/expenses";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

export const defaultRow = () => ({
  id: crypto.randomUUID(),
  category: "",
  keywords: [],
});

export function AddCategories() {
  const tableRowSchema: ZodObject = makeCategoriesRowSchema();

  const columns: ColumnDef<any>[] = categoriesColumns();

  const { data: categories }: { data: IExpensesCategory[] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => new ExpensesService().getCategories(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const saveCategories = async (data: any[]) => {
    const expensesService = new ExpensesService();
    await expensesService.saveCategories(data as IExpensesCategory[]);
  };

  return (
    <>
      {categories && (
        <Card className='m-8 border-0'>
          <CardHeader>
            <CardTitle>Manage Categories of your Expenses</CardTitle>
            {/* <CardDescription>Categroes</CardDescription> */}
          </CardHeader>
          <DataTable
            name={"expenses-pivot-table"}
            columns={columns}
            data={categories}
            tableSchema={tableRowSchema}
            createEmptyRow={defaultRow}
            actions={{
              addRow: true,
              editRow: true,
              deleteRow: true,
              copyTableToClipboard: true,
              importRows: (data: any[]) => {
                const categories: IExpensesCategory[] = [];
                for (const row of data) {
                  if (!row.category && !row.keywords) {
                    Toast.error("Import with category and keywords as columns");
                    return;
                  }
                  categories.push({
                    category: row.category?.trim() ?? "",
                    keywords:
                      typeof row.keywords === "string"
                        ? row.keywords.split(",").map((k) => k.trim())
                        : [],
                  });
                }
                const importRows = [];
                categories.map((row) => {
                  const newRow = {
                    ...defaultRow(),
                    category: row.category,
                    keywords: row.keywords,
                  };
                  importRows.push({ ...newRow, _draft: { ...newRow }, _editing: false });
                });
                return importRows;
              },
              saveTable: saveCategories,
            }}
          />
        </Card>
      )}
    </>
  );
}
