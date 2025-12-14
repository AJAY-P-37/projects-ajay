import { IExpensesCategory, IProcessExpenseFileRequest } from "common-types/types/expenses";
import { api } from "./Service";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";

export default class ExpensesService {
  private basePath = "/api/expenses";
  constructor() {}

  public processMonthlyExpenseStatements = async ({
    month,
    year,
    statementType,
    statementFilesMetadata,
  }: IProcessExpenseFileRequest) => {
    const { data, status } = await api.post(`${this.basePath}/processMonthlyExpenseStatements`, {
      month,
      year,
      statementType,
      statementFilesMetadata,
    });

    if (status === 200) {
      Toast.success(data?.message || `Processed your ${statementType} card statement(s)`);
    } else if (data?.error?.message && (status < 400 || status >= 500)) {
      Toast.error(data?.error?.message || "Something went wrong");
    }
    return data;
  };

  public saveMonthlyExpenseData = async ({ year, month, expenseData }) => {
    const { data, status } = await api.post(`${this.basePath}/saveMonthlyExpenseData`, {
      month,
      year,
      expenseData,
    });
    if (status === 200) {
      Toast.success(data?.message || "Saved your monthly expense data");
    } else if (data?.message && status >= 500) {
      Toast.error(data?.message || "Could not save your Expense Data! Please contact Admin");
    }
    return data;
  };

  public getMonthlyExpensesPivotTable = async (month: number, year: number) => {
    const { data, status } = await api.get(
      `${this.basePath}/getMonthlyExpensesPivotTable?year=${year}&month=${month}`,
    );
    if (status === 200) {
      Toast.success(data?.message || "Retrieved your consolidated expense data");
    } else if (data?.message && status >= 500) {
      Toast.error(data?.message || "Could not get expense data");
    }
    return data;
  };

  public getCategories = async () => {
    const { data, status } = await api.get(`${this.basePath}/getCategories`);
    if (data?.message && status >= 500) {
      Toast.error(data?.message || "Could not get Categories data");
    }
    return data;
  };

  public saveCategories = async (categories: IExpensesCategory[]) => {
    const { data, status } = await api.post(`${this.basePath}/saveCategories`, {
      categories,
    });
    if (status === 200) {
      Toast.success(data?.message || "Saved your monthly updated Categories");
    } else if (data?.error?.message && status >= 500) {
      Toast.error(data?.message || "Could not save your Categories! Please contact Admin");
    }
    return data;
  };

  public getYearlyConsolidatedPivotTable = async (year: number) => {
    const { data, status } = await api.get(
      `${this.basePath}/getYearlyConsolidatedPivotTable/${year}`,
    );
    if (data?.message && status >= 500) {
      Toast.error(data?.message || "Could not get Monthly Consolidated Expenses data");
    }
    return data;
  };

  public getMonthlyConsolidatedPivotTable = async (year: number) => {
    const { data, status } = await api.get(
      `${this.basePath}/getMonthlyConsolidatedPivotTable/${year}`,
    );
    if (data?.message && status >= 500) {
      Toast.error(data?.message || "Could not get Monthly Consolidated Expenses data");
    }
    return data;
  };
}
