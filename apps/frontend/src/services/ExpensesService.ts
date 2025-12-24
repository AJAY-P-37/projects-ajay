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
    const { data } = await api.post(`${this.basePath}/processMonthlyExpenseStatements`, {
      month,
      year,
      statementType,
      statementFilesMetadata,
    });
    return data;
  };

  public saveMonthlyExpenseData = async ({ year, month, expenseData }) => {
    const { data } = await api.post(`${this.basePath}/saveMonthlyExpenseData`, {
      month,
      year,
      expenseData,
    });

    return data;
  };

  public getMonthlyExpenseData = async (year: number, month: number) => {
    const { data } = await api.get(
      `${this.basePath}/getMonthlyExpenseData?year=${year}&month=${month}`,
    );
    return data;
  };

  public getMonthlyExpensesPivotTable = async (month: number, year: number) => {
    const { data } = await api.get(
      `${this.basePath}/getMonthlyExpensesPivotTable?year=${year}&month=${month}`,
    );
    return data;
  };

  public getCategories = async () => {
    const { data } = await api.get(`${this.basePath}/getCategories`);

    return data;
  };

  public saveCategories = async (categories: IExpensesCategory[]) => {
    const { data } = await api.post(`${this.basePath}/saveCategories`, {
      categories,
    });
    return data;
  };

  public getYearlyConsolidatedPivotTable = async (year: number) => {
    const { data } = await api.get(`${this.basePath}/getYearlyConsolidatedPivotTable/${year}`);
    return data;
  };

  public getMonthlyConsolidatedPivotTable = async (year: number) => {
    const { data } = await api.get(`${this.basePath}/getMonthlyConsolidatedPivotTable/${year}`);

    return data;
  };
}
