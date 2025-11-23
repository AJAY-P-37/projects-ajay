import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../../components/common/datatable/DataTable";
import { expenseColumns, makeExpenseRowSchema } from "./Columns";
import { UseFormReturn } from "react-hook-form";
import { ProcessExpenseFileResponse } from "common-types/types/expenses";
import { ExpensesFormData } from "../MonthlyExpensesFormSchema";
import { ZodObject } from "zod";
import ExpensesService from "@/services/ExpensesService";
import { Card, CardDescription, CardHeader, CardTitle } from "shadcn-lib/dist/components/ui/card";

export type ExpensesTableProps = {
  rows: ProcessExpenseFileResponse["processedData"];
  categories: ProcessExpenseFileResponse["categoriesData"];
  expensesForm: UseFormReturn<ExpensesFormData>;
};

export const defaultRow = () => ({
  id: crypto.randomUUID(),
  amount: 0,
  category: "",
});

export const ExpensesVisual = ({ rows = [], categories, expensesForm }: ExpensesTableProps) => {
  const tableRowSchema: ZodObject = makeExpenseRowSchema({
    categories,
  });

  const columns: ColumnDef<any>[] = expenseColumns({
    categories,
  });

  const month = parseInt(expensesForm.watch("month"));
  const year = parseInt(expensesForm.watch("year"));
  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
  });

  return (
    <>
      <Card className='mb-4'>
        <CardHeader>
          <CardTitle>Expenses Pivot Table</CardTitle>
          <CardDescription>
            {monthName} {year}
          </CardDescription>
        </CardHeader>

        <DataTable
          name={"expenses-pivot-table"}
          columns={columns}
          data={rows}
          tableSchema={tableRowSchema}
          actions={{
            copyTableToClipboard: true,
          }}
        />
      </Card>
    </>
  );
};
