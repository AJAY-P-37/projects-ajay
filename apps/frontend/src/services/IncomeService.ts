import { api } from "./Service";
import { IIncomeSource } from "common-types/types/expenses";

export default class IncomeService {
  private basePath = "/api/income";

  public getIncomeSources = async (): Promise<IIncomeSource[]> => {
    const { data } = await api.get(`${this.basePath}/getIncomeSources`);
    return data;
  };

  public saveIncomeSources = async (sources: IIncomeSource[]) => {
    const { data } = await api.post(`${this.basePath}/saveIncomeSources`, {
      sources,
    });
    return data;
  };

  public saveMonthlyIncomeData = async ({
    year,
    month,
    incomeData,
  }: {
    year: number;
    month: number;
    incomeData: any[];
  }) => {
    const { data } = await api.post(`${this.basePath}/saveMonthlyIncomeData`, {
      month,
      year,
      incomeData,
    });
    return data;
  };

  public getMonthlyIncomeData = async (year: number, month: number) => {
    const { data } = await api.get(
      `${this.basePath}/getMonthlyIncomeData?year=${year}&month=${month}`,
    );
    return data;
  };

  public getIncomeDataByRange = async (params: {
    startYear?: number;
    startMonth?: number;
    endYear?: number;
    endMonth?: number;
    allData?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params.allData) query.append("allData", "true");
    if (params.startYear !== undefined) query.append("startYear", String(params.startYear));
    if (params.startMonth !== undefined) query.append("startMonth", String(params.startMonth));
    if (params.endYear !== undefined) query.append("endYear", String(params.endYear));
    if (params.endMonth !== undefined) query.append("endMonth", String(params.endMonth));

    const { data } = await api.get(`${this.basePath}/getIncomeDataByRange?${query.toString()}`);
    return data;
  };

  public saveBulkIncomeData = async (incomeData: any[]) => {
    const { data } = await api.post(`${this.basePath}/saveBulkIncomeData`, { incomeData });
    return data;
  };

  public getMonthlyConsolidatedPivotTable = async (year: number) => {
    const { data } = await api.get(
      `${this.basePath}/getMonthlyConsolidatedPivotTable/${year}`,
    );
    return data;
  };

  public getYearlyConsolidatedPivotTable = async (year: number) => {
    const { data } = await api.get(
      `${this.basePath}/getYearlyConsolidatedPivotTable/${year}`,
    );
    return data;
  };

  public getFinancialOverview = async (year: number) => {
    const { data } = await api.get(`${this.basePath}/getFinancialOverview/${year}`);
    return data;
  };
}
