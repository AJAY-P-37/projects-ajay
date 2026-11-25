import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../../components/common/datatable/DataTable";
import { expenseColumns, makeExpenseRowSchema } from "./Columns";
import { UseFormReturn } from "react-hook-form";
import {
  AICategorizeExpenseItem,
  IExpensesCategory,
  ProcessExpenseFileResponse,
} from "common-types/types/expenses";
import { ExpensesFormData } from "../MonthlyExpensesFormSchema";
import { ZodObject } from "zod";
import ExpensesService from "@/services/ExpensesService";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { LoaderCircle, Sparkles } from "lucide-react";
import { collectAllErrors } from "@/components/common/datatable/TableUtils";

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
  const [aiCategorizedMap, setAiCategorizedMap] = useState<Record<string, string>>({});

  const tableRowSchema: ZodObject = makeExpenseRowSchema({
    categories,
    month,
    year,
  });

  const columns: ColumnDef<any>[] = expenseColumns({
    categories,
    aiCategorizedMap,
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
      const monthlyExpenseData = await expensesService.getMonthlyExpensesPivotTable(month, year);
      setExpenseData(data);
      setMonthlyPivotData(monthlyExpenseData);
      return savedData;
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Saved monthly expense data");
    },
    onError: (error) => {
      Toast.error(error?.message || "Could not save expense");
    },
  });
  const { mutateAsync: categorizeWithAI, isPending: isCategorizingWithAI } = useMutation({
    mutationFn: async (items: AICategorizeExpenseItem[]) => {
      const expensesService = new ExpensesService();
      return expensesService.categorizeWithAI(items);
    },
    onError: (error: any) => {
      Toast.error(error?.message || "Could not categorize expenses with AI");
    },
  });

  const onSaveTable = async (data: ProcessExpenseFileResponse["processedData"]) => {
    await saveExpenses({ data, month, year });
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
        customHeaderActions: ({ latestRowsRef, setRows, tableSchema, setErrors }) => {
          const handleCategorizeWithAI = async () => {
            const currentRows = latestRowsRef.current || [];
            const invalidRows = currentRows.filter((row: any) => {
              const effective = row._editing ? row._draft : row;
              return !categories.includes(effective?.category);
            });

            if (invalidRows.length === 0) {
              Toast.info("All expenses already have valid categories");
              return;
            }

            const items: AICategorizeExpenseItem[] = invalidRows
              .map((row: any) => {
                const effective = row._editing ? row._draft : row;
                return {
                  id: row.id,
                  statementRecord: String(effective?.statementRecord || "").trim(),
                  currentCategory: effective?.category ? String(effective.category) : undefined,
                  amount:
                    typeof effective?.amount === "number" && !Number.isNaN(effective.amount)
                      ? effective.amount
                      : undefined,
                };
              })
              .filter((item) => item.statementRecord.length > 0);

            if (items.length === 0) {
              Toast.info("No statement records available to categorize with AI");
              return;
            }

            let response;
            try {
              response = await categorizeWithAI(items);
            } catch {
              return;
            }
            const resultMap = new Map<string, string>(
              (response?.results || []).map((r) => [r.id, r.category]),
            );

            const latestRows = latestRowsRef.current || [];
            let categorizedCount = 0;
            const newAiEntries: Record<string, string> = {};

            const nextRows = latestRows.map((row: any) => {
              const suggested = resultMap.get(row.id);
              if (!suggested || !categories.includes(suggested)) {
                return row;
              }
              categorizedCount++;
              newAiEntries[row.id] = suggested;
              if (row._editing) {
                return {
                  ...row,
                  _draft: { ...(row._draft || {}), category: suggested },
                };
              }
              return {
                ...row,
                category: suggested,
                _draft: { ...(row._draft || {}), category: suggested },
              };
            });

            if (Object.keys(newAiEntries).length > 0) {
              setAiCategorizedMap((prev) => ({ ...prev, ...newAiEntries }));
            }
            setRows(nextRows);
            setErrors(
              collectAllErrors(
                nextRows.map((r: any) => (r._editing ? { ...r._draft, id: r.id } : r)),
                tableSchema,
              ),
            );

            const remainingInvalidCount = items.length - categorizedCount;
            if (categorizedCount === 0) {
              Toast.info("AI could not match any of the invalid categories");
            } else if (remainingInvalidCount > 0) {
              Toast.success(
                `AI categorized ${categorizedCount} expense(s). ${remainingInvalidCount} still need manual review.`,
              );
            } else {
              Toast.success(`AI categorized ${categorizedCount} expense(s)`);
            }
          };

          return (
            <Button
              type='button'
              size='sm'
              variant='default'
              onClick={handleCategorizeWithAI}
              disabled={isCategorizingWithAI}
            >
              {isCategorizingWithAI ? (
                <>
                  <LoaderCircle className='animate-spin' /> Categorizing...
                </>
              ) : (
                <>
                  <Sparkles /> Categorize with AI
                </>
              )}
            </Button>
          );
        },
      }}
    />
  );
};
