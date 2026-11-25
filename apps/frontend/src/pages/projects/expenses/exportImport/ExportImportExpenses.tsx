import { useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useQuery, useMutation } from "@tanstack/react-query";
import ExpensesService from "@/services/ExpensesService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { DataTable } from "@/components/common/datatable/DataTable";
import { expenseColumns } from "../monthlyTracker/ProcessExpenseTable/Columns";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { normalizeExcelDate } from "@/components/common/datatable/TableUtils";
import { statementDocumentOptions, ProcessedExpense } from "common-types/types/expenses";
import { months, years } from "../monthlyTracker/MonthlyExpensesFormSchema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "shadcn-lib/dist/components/ui/select";
import { Loader2, Download, Upload, Database, FileSpreadsheet } from "lucide-react";

export const defaultBulkRow = (): ProcessedExpense => ({
  id: crypto.randomUUID(),
  amount: 0,
  category: "",
  date: new Date().toISOString().split("T")[0],
  statementRecord: "Manual",
  statementType: "Unknown" as any,
});

const makeBulkExpenseRowSchema = (categories: string[]) =>
  z.object({
    id: z.string(),
    amount: z
      .number({
        message: "Amount must be a number",
      })
      .positive("Amount must be greater than 0"),
    category: z.string().refine((v) => categories.includes(v), {
      message: "Invalid category",
    }),
    date: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Invalid date format (yyyy-mm-dd)",
    }),
    statementRecord: z.string().optional(),
    statementType: z.string().optional(),
  });

export const ExportImportExpenses = () => {
  const currentYr = new Date().getFullYear();
  const { startYear: userStartYear } = useUserSettings();
  const [activeTab, setActiveTab] = useState<"export" | "import">("export");

  // Export filters
  const [exportEntireData, setExportEntireData] = useState<boolean>(true);
  const [startMonth, setStartMonth] = useState<string>("0");
  const [startYear, setStartYear] = useState<string>(String(userStartYear));
  const [endMonth, setEndMonth] = useState<string>("11");
  const [endYear, setEndYear] = useState<string>(String(currentYr));

  // Import local rows state
  const [importedRows, setImportedRows] = useState<ProcessedExpense[]>([]);

  const expensesService = new ExpensesService();

  // Fetch categories
  const { data: categoriesData = [], isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: () => expensesService.getCategories(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const categories = categoriesData.map((cat: any) => cat.category);

  // Query for Export Data
  const {
    data: exportRows = [],
    isFetching: isExportFetching,
    refetch: fetchExportData,
  } = useQuery({
    queryKey: ["getExpenseDataByRange", exportEntireData, startYear, startMonth, endYear, endMonth],
    queryFn: () =>
      expensesService.getExpenseDataByRange({
        allData: exportEntireData,
        startYear: Number(startYear),
        startMonth: Number(startMonth),
        endYear: Number(endYear),
        endMonth: Number(endMonth),
      }),
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Mutation for saving imported rows
  const { mutateAsync: saveBulkExpenses, isPending: isSavingBulk } = useMutation({
    mutationFn: async (data: ProcessedExpense[]) => {
      return await expensesService.saveBulkExpenseData(data);
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Successfully saved imported expenses!");
      setImportedRows([]);
    },
    onError: (error: any) => {
      Toast.error(error?.message || "Failed to save imported expenses");
    },
  });

  const columns: ColumnDef<any>[] = expenseColumns({ categories });
  const bulkSchema = makeBulkExpenseRowSchema(categories);

  const totalExportAmount = exportRows.reduce(
    (sum: number, r: any) => sum + (Number(r.amount) || 0),
    0,
  );

  return (
    <div className='mx-3 my-6 space-y-6'>
      {/* Top Header & Tab Navigation */}
      <Card className='border-0 shadow-sm'>
        <CardHeader className='flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4'>
          <div>
            <CardTitle className='text-2xl font-bold flex items-center gap-2'>
              <Database className='w-6 h-6 text-primary' />
              Export & Import Expenses
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Export your expense dataset across custom date ranges or bulk import historical
              records.
            </CardDescription>
          </div>

          <div className='flex items-center gap-2 bg-muted p-1 rounded-lg self-start md:self-auto'>
            <Button
              variant={activeTab === "export" ? "default" : "ghost"}
              size='sm'
              onClick={() => setActiveTab("export")}
              className='gap-2'
            >
              <Download className='w-4 h-4' />
              Export Data
            </Button>
            <Button
              variant={activeTab === "import" ? "default" : "ghost"}
              size='sm'
              onClick={() => setActiveTab("import")}
              className='gap-2'
            >
              <Upload className='w-4 h-4' />
              Import Data
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* TAB 1: EXPORT SECTION */}
      {activeTab === "export" && (
        <div className='space-y-6'>
          <Card className='border'>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <FileSpreadsheet className='w-5 h-5 text-primary' />
                Export Range Filter
              </CardTitle>
              <CardDescription>
                By default, all expense data will be fetched. Uncheck "Export Entire Data" to select
                a custom date range.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-6'>
              <div className='flex items-center gap-3'>
                <label className='flex items-center gap-2 cursor-pointer text-sm font-medium'>
                  <input
                    type='checkbox'
                    checked={exportEntireData}
                    onChange={(e) => setExportEntireData(e.target.checked)}
                    className='w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary'
                  />
                  <span>Export Entire Data (All Years & Months)</span>
                </label>
              </div>

              {!exportEntireData && (
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/40 rounded-lg border'>
                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-muted-foreground'>
                      From Month
                    </label>
                    <Select value={startMonth} onValueChange={setStartMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-muted-foreground'>From Year</label>
                    <Select value={startYear} onValueChange={setStartYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {years.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-muted-foreground'>To Month</label>
                    <Select value={endMonth} onValueChange={setEndMonth}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {months.map((m) => (
                            <SelectItem key={m.value} value={m.value}>
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className='space-y-1.5'>
                    <label className='text-xs font-semibold text-muted-foreground'>To Year</label>
                    <Select value={endYear} onValueChange={setEndYear}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {years.map((y) => (
                            <SelectItem key={y.value} value={y.value}>
                              {y.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className='flex items-center justify-between pt-2'>
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                  <span>
                    Total Records: <strong className='text-foreground'>{exportRows.length}</strong>
                  </span>
                  <span>
                    Total Amount:{" "}
                    <strong className='text-foreground'>
                      ₹{totalExportAmount.toLocaleString("en-IN")}
                    </strong>
                  </span>
                </div>

                <Button onClick={() => fetchExportData()} disabled={isExportFetching} size='sm'>
                  {isExportFetching && <Loader2 className='w-4 h-4 animate-spin mr-2' />}
                  Refresh Query
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Export Table View */}
          <Card className='border'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-semibold'>Export Preview & Download</CardTitle>
              <CardDescription>
                Use the Export button in the table header below to download an Excel (.xlsx) file.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isExportFetching || isCategoriesLoading ? (
                <div className='flex justify-center items-center py-20'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <DataTable
                  name='export-expenses-table'
                  columns={columns}
                  data={exportRows}
                  tableSchema={bulkSchema as any}
                  createEmptyRow={defaultBulkRow}
                  actions={{
                    exportRows: true,
                    exportFileName: exportEntireData
                      ? "all-expenses-export.xlsx"
                      : `expenses-${startYear}-${Number(startMonth) + 1}-to-${endYear}-${Number(endMonth) + 1}.xlsx`,
                    copyTableToClipboard: true,
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 2: IMPORT SECTION */}
      {activeTab === "import" && (
        <div className='space-y-6'>
          <Card className='border'>
            <CardHeader>
              <CardTitle className='text-lg flex items-center gap-2'>
                <Upload className='w-5 h-5 text-primary' />
                Import Expenses via Excel / CSV
              </CardTitle>
              <CardDescription>
                Click "Import" in the table header below to upload an Excel file (.xlsx). Review and
                edit the imported rows before saving.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className='border'>
            <CardHeader className='pb-2'>
              <CardTitle className='text-base font-semibold'>Import Workspace</CardTitle>
            </CardHeader>
            <CardContent>
              {isCategoriesLoading ? (
                <div className='flex justify-center items-center py-20'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <DataTable
                  name='import-expenses-table'
                  columns={columns}
                  data={importedRows}
                  tableSchema={bulkSchema as any}
                  createEmptyRow={defaultBulkRow}
                  actions={{
                    addRow: true,
                    editRow: true,
                    deleteRow: true,
                    copyTableToClipboard: true,
                    exportRows: true,
                    importColumnDetails: {
                      amount: "Amount spent in Number format (> 0)",
                      category: `Valid Category name (${categories.slice(0, 5).join(", ")}...)`,
                      date: "Date format (yyyy-mm-dd or Excel Date)",
                      statementRecord: "Description/Record from bank statement",
                      statementType: `Optional statement type (${statementDocumentOptions.map((o) => o.label).join(", ")})`,
                    },
                    importRows: (data: any[]) => {
                      const newRows: ProcessedExpense[] = [];

                      for (const rawRow of data) {
                        const row: Record<string, any> = {};
                        for (const k in rawRow) {
                          row[k.trim().toLowerCase()] = rawRow[k];
                        }

                        if (!row.category || !row.date) {
                          Toast.error("Import rows must contain 'date' and 'category' columns");
                          continue;
                        }

                        const amount = Number(row.amount);
                        if (isNaN(amount) || amount < 0) {
                          Toast.error(`Invalid amount for row category "${row.category}"`);
                          continue;
                        }

                        let normDate = "";
                        try {
                          normDate = normalizeExcelDate(row.date);
                        } catch {
                          normDate = new Date().toISOString().split("T")[0];
                        }

                        newRows.push({
                          id: crypto.randomUUID(),
                          amount,
                          category: String(row.category).trim(),
                          date: normDate,
                          statementRecord: String(
                            row.statementrecord || row.statement_record || "Imported",
                          ),
                          statementType: (row.statementtype ||
                            row.statement_type ||
                            "Unknown") as any,
                        });
                      }

                      Toast.success(`Imported ${newRows.length} valid rows into table!`);
                      setImportedRows(newRows);
                      return newRows;
                    },
                    saveTable: async (rowsToSave) => {
                      await saveBulkExpenses(rowsToSave);
                    },
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
