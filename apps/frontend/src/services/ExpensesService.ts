import { IProcessExpenseFileRequest } from "common-types/types/expenses";
import { api } from "./Service";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

export default class ExpensesService {
  private basePath = "/api/expenses";
  constructor() {}

  public processMonthlyExpenseStatements = async ({
    month,
    year,
    statementType,
    statementFileMetadata,
  }: IProcessExpenseFileRequest) => {
    const { data, status } = await api.post(`${this.basePath}/processMonthlyExpenseStatements`, {
      month,
      year,
      statementType,
      statementFileMetadata,
    });

    if (status !== 200) {
      Toast.error(data?.message || "Could not process your Statements! Please contact Admin");
      return data;
    } else {
      Toast.success(data?.message || "Processed your statement(s)");
    }
    return data;
  };

  public saveMonthlyExpenseData = async ({ year, month, expenseData }) => {
    const { data, status } = await api.post(`${this.basePath}/saveMonthlyExpenseData`, {
      month,
      year,
      expenseData,
    });
    if (status !== 200) {
      Toast.error(data?.message || "Could not save your Expense Data! Please contact Admin");
    } else {
      Toast.success(data?.message || "Saved your monthly expense data");
    }
    return data;
  };

  public getMonthlyExpensesPivotTable = async (month: number, year: number) => {
    const { data, status } = await api.get(
      `${this.basePath}/getMonthlyExpensesPivotTable?year=${year}&month=${month}`,
    );
    if (status !== 200) {
      Toast.error(data?.message || "Could not get expense data");
    } else {
      Toast.success(data?.message || "Retrieved your consolidated expense data");
    }
    return data;
  };
}
