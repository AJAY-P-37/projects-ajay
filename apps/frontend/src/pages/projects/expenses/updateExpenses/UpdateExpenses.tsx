import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../components/common/datatable/DataTable";
import {
  expenseColumns,
  makeExpenseRowSchema,
} from "../monthlyTracker/ProcessExpenseTable/Columns";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  IExpensesCategory,
  IProcessExpenseFileRequest,
  ProcessedExpense,
  ProcessExpenseFileResponse,
} from "common-types/types/expenses";
import {
  currentMonth,
  currentYear,
  ExpensesFormData,
  expensesSchema,
  months,
  years,
} from "../monthlyTracker/MonthlyExpensesFormSchema";
import { ZodObject } from "zod";
import ExpensesService from "@/services/ExpensesService";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { FormSelect } from "@/components/common/storybook/select";
import { useEffect } from "react";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { getAccessorKey, normalizeExcelDate } from "@/components/common/datatable/TableUtils";
import { Loader } from "@/components/common/storybook/loader";

export const defaultRow = () => ({
  id: crypto.randomUUID(),
  amount: 0,
  category: "",
  date: new Date().toISOString().split("T")[0],
  statementRecord: "",
  statementType: "",
});

export const UpdateExpenses = () => {
  const expensesFormHook: UseFormReturn<ExpensesFormData> = useForm<ExpensesFormData>({
    resolver: zodResolver(expensesSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
    },
  });

  const { control, watch } = expensesFormHook;

  const month = parseInt(watch("month"));
  const year = parseInt(watch("year"));

  const monthName = new Date(year, month).toLocaleString("en-US", {
    month: "long",
  });

  const { mutateAsync: saveExpenses } = useMutation({
    mutationFn: async ({
      data,
      month,
      year,
    }: {
      data: ProcessExpenseFileResponse["processedData"];
      month: number;
      year: number;
    }) => {
      const expensesService = new ExpensesService();
      const savedData = await expensesService.saveMonthlyExpenseData({
        month,
        year,
        expenseData: data,
      });
      return savedData;
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Saved monthly expense data");
    },
    onError: (error) => {
      Toast.error(error?.message || "Could not save expense");
    },
  });

  const {
    data: categoriesData,
    isLoading: isCategoriesLoading,
    isError: isCategoryError,
  }: { data: ProcessedExpense[]; isLoading: boolean; isError: boolean } = useQuery({
    queryKey: ["categories"],
    queryFn: () => new ExpensesService().getCategories(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const {
    data: rows = [],
    isFetching: isRowsFetching,
    isError: isExpenseError,
  }: { data: ProcessedExpense[]; isFetching: boolean; isError: boolean } = useQuery({
    queryKey: ["getMonthlyExpenseData", year, month],
    queryFn: () => new ExpensesService().getMonthlyExpenseData(year, month),
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (isCategoryError || isExpenseError) return;

  const categories = categoriesData?.map((cat) => cat.category);

  const tableRowSchema: ZodObject = makeExpenseRowSchema({
    categories,
    month,
    year,
  });

  const columns: ColumnDef<any>[] = expenseColumns({
    categories,
  });

  const onSaveTable = async (data: ProcessExpenseFileResponse["processedData"]) => {
    await saveExpenses({ data, year, month });
  };

  return (
    <Card className='m-8 border-0'>
      <CardHeader>
        <CardTitle>Update Expense</CardTitle>
        <CardDescription>
          {monthName} {year}
        </CardDescription>
        <CardAction className='flex flex-row space-x-2'>
          <FormSelect name='month' options={months} control={control} required />
          <FormSelect name='year' options={years} control={control} required />
        </CardAction>
      </CardHeader>
      {!isCategoriesLoading && !isRowsFetching ? (
        <DataTable
          name={"update-expenses-table"}
          columns={columns}
          data={rows}
          tableSchema={tableRowSchema}
          createEmptyRow={defaultRow}
          actions={{
            addRow: true,
            editRow: true,
            deleteRow: true,
            copyTableToClipboard: true,
            importRows: (data) => {
              const importRows = [];

              for (const rawRow of data) {
                function normalizeRowKeys(row: Record<string, any>) {
                  const normalized: Record<string, any> = {};
                  for (const key in row) {
                    normalized[key.trim().toLowerCase()] = row[key];
                  }
                  return normalized;
                }

                const row = normalizeRowKeys(rawRow);
                // Validate required fields

                if (!row.category || !row.date) {
                  Toast.error("Import file must contain 'date', 'category', and 'amount' columns");
                  return;
                }

                const amount = Number(row?.amount);

                if (Number.isNaN(amount) || amount < 0) {
                  Toast.error(`Invalid amount for category "${row.category}"`);
                  return;
                }

                // Normalize date
                let date: string;
                try {
                  date = normalizeExcelDate(row.date);
                } catch {
                  Toast.error(`Invalid date format for category "${row.category}"`);
                  return;
                }

                const newRow: ProcessedExpense & {
                  _draft: ProcessedExpense;
                  _editing: boolean;
                } = {
                  ...defaultRow(),
                  date,
                  category: String(row.category).trim(),
                  amount,
                  statementRecord: row.statementrecord?.toString().trim() ?? "",
                  statementType: row.statementtype ?? undefined,

                  _draft: {
                    date,
                    category: String(row.category).trim(),
                    amount,
                    statementRecord: row.statementrecord?.toString().trim() ?? "",
                    statementType: row.statementtype ?? undefined,
                  },
                  _editing: false,
                };

                importRows.push(newRow);
              }

              return importRows;
            },
            saveTable: onSaveTable,
          }}
        />
      ) : (
        <Loader />
      )}
    </Card>
  );
};
