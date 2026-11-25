import { useState } from "react";
import { useUserSettings } from "@/hooks/useUserSettings";
import { useQuery, useMutation } from "@tanstack/react-query";
import IncomeService from "@/services/IncomeService";
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
import { incomeColumns, IncomeRow } from "../updateIncome/Columns";
import { z } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { normalizeExcelDate } from "@/components/common/datatable/TableUtils";
import { incomeSourceOptions } from "common-types/types/expenses";
import { months, years } from "../../expenses/monthlyTracker/MonthlyExpensesFormSchema";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "shadcn-lib/dist/components/ui/select";
import { Loader2, Download, Upload, Database, FileSpreadsheet } from "lucide-react";

export const defaultBulkIncomeRow = (source = "Salary"): IncomeRow => ({
  id: crypto.randomUUID(),
  amount: 0,
  source,
  date: new Date().toISOString().split("T")[0],
  note: "",
  _editing: false,
});

const makeBulkIncomeRowSchema = (sources: string[]) =>
  z.object({
    id: z.string(),
    amount: z
      .number({
        message: "Amount must be a number",
      })
      .positive("Amount must be greater than 0"),
    source: z.string().refine((v) => sources.includes(v), {
      message: "Invalid source. Please select or add it in Income Sources",
    }),
    date: z.string().refine((val) => !isNaN(new Date(val).getTime()), {
      message: "Invalid date format (yyyy-mm-dd)",
    }),
    note: z.string().optional(),
  });

export const ExportImportIncome = () => {
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
  const [importedRows, setImportedRows] = useState<IncomeRow[]>([]);

  const incomeService = new IncomeService();

  // Query for Income Sources
  const { data: sourcesData = [], isLoading: isSourcesLoading } = useQuery({
    queryKey: ["incomeSources"],
    queryFn: () => incomeService.getIncomeSources(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const allSources = sourcesData.map((s: any) => s.source);

  // Query for Export Data
  const {
    data: exportRows = [],
    isFetching: isExportFetching,
    refetch: fetchExportData,
  } = useQuery({
    queryKey: ["getIncomeDataByRange", exportEntireData, startYear, startMonth, endYear, endMonth],
    queryFn: () =>
      incomeService.getIncomeDataByRange({
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
  const { mutateAsync: saveBulkIncome, isPending: isSavingBulk } = useMutation({
    mutationFn: async (data: IncomeRow[]) => {
      return await incomeService.saveBulkIncomeData(data);
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Successfully saved imported income records!");
      setImportedRows([]);
    },
    onError: (error: any) => {
      Toast.error(error?.message || "Failed to save imported income");
    },
  });

  const columns: ColumnDef<any>[] = incomeColumns({ sources: allSources });

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
              Export & Import Income
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Export your income dataset across custom date ranges or bulk import records.
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
                By default, all income data will be fetched. Uncheck "Export Entire Data" to select
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
              {isExportFetching ? (
                <div className='flex justify-center items-center py-20'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <DataTable
                  name='export-income-table'
                  columns={columns}
                  data={exportRows}
                  tableSchema={makeBulkIncomeRowSchema(allSources) as any}
                  createEmptyRow={() => defaultBulkIncomeRow(allSources[0] || "Salary")}
                  actions={{
                    exportRows: true,
                    exportFileName: exportEntireData
                      ? "all-income-export.xlsx"
                      : `income-${startYear}-${Number(startMonth) + 1}-to-${endYear}-${Number(endMonth) + 1}.xlsx`,
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
                Import Income via Excel / CSV
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
              {isSourcesLoading ? (
                <div className='flex justify-center items-center py-20'>
                  <Loader2 className='w-8 h-8 animate-spin text-muted-foreground' />
                </div>
              ) : (
                <DataTable
                  name='import-income-table'
                  columns={columns}
                  data={importedRows}
                  tableSchema={makeBulkIncomeRowSchema(allSources) as any}
                  createEmptyRow={() => defaultBulkIncomeRow(allSources[0] || "Salary")}
                  actions={{
                    addRow: true,
                    editRow: true,
                    deleteRow: true,
                    copyTableToClipboard: true,
                    exportRows: true,
                    importColumnDetails: {
                      date: "Date format (yyyy-mm-dd or Excel Date)",
                      source: `Valid source name (${allSources.join(", ")})`,
                      amount: "Amount received in Number format (> 0)",
                      note: "Optional note or description",
                    },
                    importRows: (data: any[]) => {
                      const newRows: IncomeRow[] = [];

                      for (const rawRow of data) {
                        const row: Record<string, any> = {};
                        for (const k in rawRow) {
                          row[k.trim().toLowerCase()] = rawRow[k];
                        }

                        const sourceName = String(row.source || row["income source"] || "").trim();
                        if (!sourceName || !row.date) {
                          Toast.error("Import rows must contain 'date' and 'source' columns");
                          continue;
                        }

                        if (!allSources.includes(sourceName)) {
                          Toast.error(
                            `Source "${sourceName}" is not configured. Please add it to Income Sources first.`,
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
                          id: crypto.randomUUID(),
                          amount,
                          source: sourceName,
                          date: normDate,
                          note: String(row.note || ""),
                          _editing: false,
                          _draft: {
                            id: crypto.randomUUID(),
                            amount,
                            source: sourceName,
                            date: normDate,
                            note: String(row.note || ""),
                            _editing: false,
                          },
                        });
                      }

                      Toast.success(`Imported ${newRows.length} valid rows into table!`);
                      setImportedRows(newRows);
                      return newRows;
                    },
                    saveTable: async (rowsToSave) => {
                      await saveBulkIncome(rowsToSave);
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
