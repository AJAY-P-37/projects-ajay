import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { DataTable } from "@/components/common/datatable/DataTable";
import { incomeSourceColumns, makeIncomeSourceRowSchema, IncomeSourceRow } from "./Columns";
import { ZodObject } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import IncomeService from "@/services/IncomeService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { IIncomeSource } from "common-types/types/expenses";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { Loader } from "@/components/common/storybook/loader";

export const defaultIncomeSourceRow = (): IncomeSourceRow => ({
  id: crypto.randomUUID(),
  source: "",
  description: "",
  _editing: false,
});

export function AddIncomeSources() {
  const queryClient = useQueryClient();
  const tableRowSchema: ZodObject<any> = makeIncomeSourceRowSchema();
  const columns: ColumnDef<any>[] = incomeSourceColumns();

  const {
    data: incomeSources = [],
    isLoading: isSourcesLoading,
  }: { data: IIncomeSource[]; isLoading: boolean } = useQuery({
    queryKey: ["incomeSources"],
    queryFn: () => new IncomeService().getIncomeSources(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const { mutateAsync: saveSourcesMutation } = useMutation({
    mutationFn: async ({ data }: { data: IIncomeSource[] }) => {
      const incomeService = new IncomeService();
      return await incomeService.saveIncomeSources(data);
    },
    onSuccess: (data: any) => {
      Toast.success(data?.message || "Saved income sources");
      queryClient.invalidateQueries({ queryKey: ["incomeSources"] });
    },
    onError: (error: any) => {
      Toast.error(error?.message || "Could not save income sources");
    },
  });

  const saveSources = async (data: any[]) => {
    const formattedData: IIncomeSource[] = data.map((d) => ({
      source: String(d.source).trim(),
      description: String(d.description || "").trim(),
    }));
    await saveSourcesMutation({ data: formattedData });
  };

  const rows: IncomeSourceRow[] = incomeSources.map((item) => ({
    id: crypto.randomUUID(),
    source: item.source,
    description: item.description || "",
    _editing: false,
  }));

  return isSourcesLoading ? (
    <Loader />
  ) : (
    <Card className='mx-3 my-8 border-0'>
      <CardHeader>
        <CardTitle>Set Up Income Sources</CardTitle>
        <CardDescription>
          Configure and manage the income sources used to validate all income entries (e.g., Salary,
          Freelance, Investment Return).
        </CardDescription>
        {incomeSources.filter((s) => s.source === "Investment Return").length === 0 && (
          <CardDescription className='text-amber-500 font-medium'>
            Tip: Include "Investment Return" as a source to track returns when withdrawing or
            maturing investments in Financial Insights.
          </CardDescription>
        )}
      </CardHeader>
      <DataTable
        name={"income-sources-table"}
        columns={columns}
        data={rows}
        tableSchema={tableRowSchema}
        createEmptyRow={defaultIncomeSourceRow}
        actions={{
          addRow: true,
          editRow: true,
          deleteRow: true,
          copyTableToClipboard: true,
          importColumnDetails: {
            source: "Name of the income source (Text format)",
            description: "Optional description of the source",
          },
          importRows: (data: any[]) => {
            const imported: IncomeSourceRow[] = [];
            for (const row of data) {
              const sourceName = row.source || row["income source"] || row["income_source"];
              if (!sourceName) {
                Toast.error("Import file must include a 'source' column");
                return;
              }
              const newRow: IncomeSourceRow = {
                id: crypto.randomUUID(),
                source: String(sourceName).trim(),
                description: String(row.description || "").trim(),
                _editing: false,
              };
              imported.push(newRow);
            }
            Toast.success(`Imported ${imported.length} source(s) into table`);
            return imported;
          },
          saveTable: saveSources,
        }}
      />
    </Card>
  );
}
