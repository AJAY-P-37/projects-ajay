import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../../components/common/datatable/DataTable";
import { expenseColumns, makeExpenseRowSchema } from "./Columns";
import { UseFormReturn } from "react-hook-form";
import {
  EStatementType,
  IExpensesCategory,
  ProcessExpenseFileResponse,
  ProcessedExpense,
} from "common-types/types/expenses";
import { ExpensesFormData } from "../MonthlyExpensesFormSchema";
import { ZodObject } from "zod";
import ExpensesService from "@/services/ExpensesService";

export type ExpensesTableProps = {
  rows: ProcessExpenseFileResponse["processedData"];
  categories: IExpensesCategory["category"][];
  expensesForm: UseFormReturn<ExpensesFormData>;
  setExpenseData: (data: ProcessExpenseFileResponse["processedData"]) => void;
  setMonthlyPivotData: (data: ProcessExpenseFileResponse["processedData"]) => void;
};

export const defaultRow = () => ({
  id: crypto.randomUUID(),
  amount: 0,
  category: "",
  date: new Date().toISOString().split("T")[0],
  statementRecord: "",
  statementType: "",
  statementRecordType: "Perfect",
});

export const ExpensesTable = ({
  rows = [],
  categories = [],
  expensesForm,
  setExpenseData,
  setMonthlyPivotData,
}: ExpensesTableProps) => {
  const month = parseInt(expensesForm.watch("month"));
  const year = parseInt(expensesForm.watch("year"));

  const tableRowSchema: ZodObject = makeExpenseRowSchema({
    categories,
    month,
    year,
  });

  const columns: ColumnDef<any>[] = expenseColumns({
    categories,
  });

  const onSaveTable = async (data: ProcessExpenseFileResponse["processedData"]) => {
    const expensesService = new ExpensesService();
    await expensesService.saveMonthlyExpenseData({ month, year, expenseData: data });
    const monthlyExpenseData = await expensesService.getMonthlyExpensesPivotTable(month, year);
    setExpenseData(data);
    setMonthlyPivotData(monthlyExpenseData);
  };

  return (
    <DataTable
      name={"expenses-table"}
      columns={columns}
      data={rows}
      tableSchema={tableRowSchema}
      createEmptyRow={defaultRow}
      actions={{
        addRow: true,
        editRow: true,
        deleteRow: true,
        copyTableToClipboard: true,
        // temporarySave: true,
        saveTable: onSaveTable,
      }}
    />
  );
};
