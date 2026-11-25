import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../../../components/common/datatable/DataTable";
import { incomeColumns, makeIncomeRowSchema, IncomeRow } from "./Columns";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { FormSelect } from "@/components/common/storybook/select";
import { ZodObject } from "zod";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { Loader } from "@/components/common/storybook/loader";
import IncomeService from "@/services/IncomeService";
import {
  currentMonth,
  currentYear,
  months,
  years,
} from "../../expenses/monthlyTracker/MonthlyExpensesFormSchema";
import { incomeSourceOptions, IIncomeSource } from "common-types/types/expenses";
import { normalizeExcelDate } from "@/components/common/datatable/TableUtils";
import z from "zod";
import { defaultBulkIncomeRow } from "../exportImport/ExportImportIncome";

const incomeFormSchema = z.object({
  month: z.string().min(1, "Please select a month"),
  year: z.string().min(1, "Please select a year"),
});
type IncomeFormData = z.infer<typeof incomeFormSchema>;

export const defaultIncomeRow = (): IncomeRow => ({
  id: crypto.randomUUID(),
  amount: 0,
  source: incomeSourceOptions[0].value,
  date: new Date().toISOString().split("T")[0],
  note: "",
  _editing: false,
  get _draft() {
    return { ...this };
  },
});

export const UpdateIncome = () => {
  const formHook: UseFormReturn<IncomeFormData> = useForm<IncomeFormData>({
    resolver: zodResolver(incomeFormSchema),
    defaultValues: {
      month: currentMonth,
      year: currentYear,
    },
  });

  const { control, watch } = formHook;
  const month = parseInt(watch("month"));
  const year = parseInt(watch("year"));

  const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });

  const {
    data: sourcesData = [],
    isLoading: isSourcesLoading,
  }: { data: IIncomeSource[]; isLoading: boolean } = useQuery({
    queryKey: ["incomeSources"],
    queryFn: () => new IncomeService().getIncomeSources(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const sources = sourcesData.map((s) => s.source);

  const { mutateAsync: saveIncome } = useMutation({
    mutationFn: async ({ data, month, year }: { data: IncomeRow[]; month: number; year: number }) => {
      const svc = new IncomeService();
      return svc.saveMonthlyIncomeData({ month, year, incomeData: data });
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Saved income data");
    },
    onError: (error: any) => {
      Toast.error(error?.message || "Could not save income");
    },
  });

  const {
    data: rows = [],
    isFetching: isRowsFetching,
    isError,
  }: { data: IncomeRow[]; isFetching: boolean; isError: boolean } = useQuery({
    queryKey: ["getMonthlyIncomeData", year, month],
    queryFn: () => new IncomeService().getMonthlyIncomeData(year, month),
    refetchOnWindowFocus: false,
    retry: false,
  });

  if (isError) return null;

  const tableRowSchema: ZodObject<any> = makeIncomeRowSchema({
    sources,
    month,
    year,
  });

  const columns: ColumnDef<any>[] = incomeColumns({ sources });

  const onSaveTable = async (data: IncomeRow[]) => {
    await saveIncome({ data, year, month });
  };

  const createEmptyRow = (): IncomeRow => defaultBulkIncomeRow(sources[0] || "Salary");


  return (
    <Card className='mx-3 my-8 border-0'>
      <CardHeader>
        <CardTitle>Update Income</CardTitle>
        <CardDescription>
          {monthName} {year}
        </CardDescription>
        <CardAction className='flex flex-row space-x-2'>
          <FormSelect name='month' options={months} control={control} required />
          <FormSelect name='year' options={years} control={control} required />
        </CardAction>
      </CardHeader>
      {!isSourcesLoading && !isRowsFetching ? (
        <DataTable
          name={"update-income-table"}
          columns={columns}
          data={rows}
          tableSchema={tableRowSchema}
          createEmptyRow={createEmptyRow}
          actions={{
            addRow: true,
            editRow: true,
            deleteRow: true,
            copyTableToClipboard: true,
            exportRows: true,
            exportFileName: `income-${year}-${monthName}.xlsx`,
            importColumnDetails: {
              date: `Date of income in Date format (yyyy-mm-dd) for ${monthName} ${year}`,
              source: `Configured source — e.g. ${sources.slice(0, 4).join(", ")}`,
              amount: "Amount received as a positive number",
              note: "Optional note or description",
            },
            importRows: (data: any[]) => {
              const newRows: IncomeRow[] = [];
              for (const rawRow of data) {
                const row: Record<string, any> = {};
                for (const k in rawRow) row[k.trim().toLowerCase()] = rawRow[k];

                const sourceName = String(row.source || row["income source"] || "").trim();
                if (!row.date || !sourceName) {
                  Toast.error("Import rows must have 'date' and 'source' columns");
                  continue;
                }

                if (!sources.includes(sourceName)) {
                  Toast.error(
                    `Source "${sourceName}" is not configured. Please add it in Income Sources first.`,
                  );
                  continue;
                }

                const amount = Number(row.amount);
                if (isNaN(amount) || amount <= 0) {
                  Toast.error(`Invalid amount for source "${sourceName}"`);
                  continue;
                }

                let normDate = "";
                try {
                  normDate = normalizeExcelDate(row.date);
                } catch {
                  normDate = new Date().toISOString().split("T")[0];
                }

                newRows.push({
                  ...createEmptyRow(),
                  date: normDate,
                  source: sourceName,
                  amount,
                  note: String(row.note || ""),
                  _editing: false,
                  _draft: {
                    id: crypto.randomUUID(),
                    date: normDate,
                    source: sourceName,
                    amount,
                    note: String(row.note || ""),
                    _editing: false,
                  },
                });
              }
              Toast.success(`Imported ${newRows.length} valid row(s) into table`);
              return newRows;
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
