import { Injectable, OnModuleInit } from "@nestjs/common";
import { Model } from "mongoose";
import { getIncomeModel, IIncomeDocument, validateIncome } from "./income.model";
import {
  getIncomeSourceModel,
  IIncomeSourceDocument,
  validateIncomeSource,
} from "./incomeSources.model";
import { IIncomeSource } from "../../common-types/types/expenses";
import { shouldMirrorUser } from "../../mongo/mirror-users";

const DEFAULT_INCOME_SOURCES: IIncomeSource[] = [
  { source: "Salary", description: "Regular employment salary" },
  { source: "Freelance", description: "Contract or freelance earnings" },
  { source: "Investment Return", description: "Maturity / withdrawal returns" },
  { source: "Rental", description: "Property rental income" },
  { source: "Gift", description: "Gifts and transfers" },
  { source: "Other", description: "Miscellaneous income" },
];

@Injectable()
export class IncomeService implements OnModuleInit {
  private IncomeModel!: Model<IIncomeDocument>;
  private IncomeSourcesModel!: Model<IIncomeSourceDocument>;
  private MirrorIncomeModel?: Model<IIncomeDocument>;
  private MirrorIncomeSourcesModel?: Model<IIncomeSourceDocument>;

  private getMirrorDatabaseName(): string | null {
    if (process.env.MIRROR_DATABASE_NAME) {
      return process.env.MIRROR_DATABASE_NAME;
    }

    const env = (process.env.ENV || process.env.NODE_ENV || "DEV").toUpperCase();

    if (env === "PROD" || env === "PRODUCTION") {
      return "transaction_db_DEV";
    }

    if (env === "DEV" || env === "DEVELOPMENT" || env === "LOCAL") {
      return "transaction_db_PROD";
    }

    return null;
  }

  private async initializeMirrorModels() {
    const mirrorDbName = this.getMirrorDatabaseName();

    if (!mirrorDbName) {
      return;
    }

    this.MirrorIncomeModel = await getIncomeModel(mirrorDbName);
    this.MirrorIncomeSourcesModel = await getIncomeSourceModel(mirrorDbName);
  }

  async onModuleInit() {
    this.IncomeModel = await getIncomeModel();
    this.IncomeSourcesModel = await getIncomeSourceModel();
    await this.initializeMirrorModels();
  }

  private getMonthRange(year: number, month: number) {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  }

  private round = (v: number) =>
    Math.round((parseFloat(v.toString()) + Number.EPSILON) * 100) / 100;

  /** ---------------------------------------------------
   * 🔹 GET INCOME SOURCES (per-user with defaults)
   * --------------------------------------------------- */
  async getIncomeSources(userId: string): Promise<IIncomeSource[]> {
    this.IncomeSourcesModel = await getIncomeSourceModel();
    const dbSources = await this.IncomeSourcesModel.find({ userId });
    if (!dbSources || dbSources.length === 0) {
      return DEFAULT_INCOME_SOURCES;
    }
    return dbSources
      .map((s) => ({ source: s.source, description: s.description || "" }))
      .sort((a, b) => a.source.localeCompare(b.source));
  }

  /** ---------------------------------------------------
   * 🔹 SAVE INCOME SOURCES (custom list, per-user)
   * --------------------------------------------------- */
  async saveIncomeSources(body: { sources: IIncomeSource[] }, userId: string) {
    try {
      const shouldMirror = shouldMirrorUser(userId);
      this.IncomeSourcesModel = await getIncomeSourceModel();
      await this.IncomeSourcesModel.deleteMany({ userId });
      if (shouldMirror && this.MirrorIncomeSourcesModel) {
        await this.MirrorIncomeSourcesModel.deleteMany({ userId });
      }

      const sources = body.sources || [];
      for (let i = 0; i < sources.length; i++) {
        const { source, description = "" } = sources[i];
        const { error } = validateIncomeSource({ userId, source, description });
        if (error) {
          throw new Error(`Invalid data in row ${i + 1}: ${error.details[0].message}`);
        }
        await this.IncomeSourcesModel.create({
          userId,
          source: String(source).trim(),
          description: String(description || "").trim(),
        });
        if (shouldMirror && this.MirrorIncomeSourcesModel) {
          await this.MirrorIncomeSourcesModel.create({
            userId,
            source: String(source).trim(),
            description: String(description || "").trim(),
          });
        }
      }
      return { message: "Saved Income Sources successfully" };
    } catch (error: any) {
      return { error: `Error saving income sources: ${error?.message}` };
    }
  }

  /** ---------------------------------------------------
   * 🔹 SAVE MONTHLY INCOME (replace whole month)
   * --------------------------------------------------- */
  async saveMonthlyIncomeData(body: { month: number; year: number; incomeData: any[] }, userId: string) {
    const { month, year, incomeData } = body;
    const { start, end } = this.getMonthRange(year, month);
    const shouldMirror = shouldMirrorUser(userId);

    const validSources = (await this.getIncomeSources(userId)).map((s) => s.source);

    for (let i = 0; i < incomeData.length; i++) {
      const { date, source, amount, note = "" } = incomeData[i];
      const { error } = validateIncome({ userId, date, source, amount, note });
      if (error) throw new Error(`Invalid data in row ${i + 1}: ${error.details[0].message}`);

      if (!validSources.includes(String(source).trim())) {
        throw new Error(
          `Row ${i + 1}: Source "${source}" does not exist. Please add it in Income Sources first.`,
        );
      }
    }

    await this.IncomeModel.deleteMany({ userId, date: { $gte: start, $lte: end } });
    if (shouldMirror && this.MirrorIncomeModel) {
      await this.MirrorIncomeModel.deleteMany({ userId, date: { $gte: start, $lte: end } });
    }

    for (let i = 0; i < incomeData.length; i++) {
      const { date, source, amount, note = "" } = incomeData[i];
      await this.IncomeModel.create({
        userId,
        date,
        source: String(source).trim(),
        amount: Number(amount),
        note: String(note || ""),
      });
      if (shouldMirror && this.MirrorIncomeModel) {
        await this.MirrorIncomeModel.create({
          userId,
          date,
          source: String(source).trim(),
          amount: Number(amount),
          note: String(note || ""),
        });
      }
    }

    const monthName = new Date(year, month).toLocaleString("en-US", { month: "long" });
    return { message: `Saved ${year} ${monthName} income data` };
  }

  /** ---------------------------------------------------
   * 🔹 FETCH MONTHLY INCOME ROWS
   * --------------------------------------------------- */
  async getMonthlyIncomeData(body: { month: number; year: number }, userId: string) {
    const { month, year } = body;
    const { start, end } = this.getMonthRange(year, month);

    const records = await this.IncomeModel.find({ userId, date: { $gte: start, $lte: end } });
    return records.map((x) => ({
      id: (x as any)._id?.toString(),
      date: x.date,
      source: x.source,
      amount: x.amount,
      note: x.note ?? "",
    }));
  }

  /** ---------------------------------------------------
   * 🔹 GET INCOME BY DATE RANGE
   * --------------------------------------------------- */
  async getIncomeDataByRange(
    body: { startYear?: number; startMonth?: number; endYear?: number; endMonth?: number; allData?: boolean },
    userId: string,
  ) {
    this.IncomeModel = await getIncomeModel();
    const { startYear, startMonth, endYear, endMonth, allData } = body;

    let query: any = { userId };

    if (!allData && startYear && endYear && startMonth !== undefined && endMonth !== undefined) {
      query.date = {
        $gte: new Date(startYear, startMonth, 1),
        $lte: new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999),
      };
    }

    const records = await this.IncomeModel.find(query).sort({ date: -1 });
    return records.map((x) => ({
      id: (x as any)._id?.toString(),
      date: new Date(x.date).toISOString().split("T")[0],
      source: x.source,
      amount: x.amount,
      note: x.note ?? "",
    }));
  }

  /** ---------------------------------------------------
   * 🔹 BULK SAVE INCOME (append — no month deletion)
   * --------------------------------------------------- */
  async saveBulkIncomeData(body: { incomeData: any[] }, userId: string) {
    const { incomeData } = body;
    this.IncomeModel = await getIncomeModel();
    const shouldMirror = shouldMirrorUser(userId);
    const validSources = (await this.getIncomeSources(userId)).map((s) => s.source);
    let savedCount = 0;

    for (let i = 0; i < incomeData.length; i++) {
      const row = incomeData[i];
      const { date, source, amount, note = "" } = row;
      if (!date || !source || amount === undefined) continue;

      const trimmedSource = String(source).trim();
      if (!validSources.includes(trimmedSource)) {
        throw new Error(
          `Row ${i + 1}: Source "${trimmedSource}" does not exist. Please add it to Income Sources first.`,
        );
      }

      const parsedDate = new Date(date);
      await this.IncomeModel.create({
        date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        source: trimmedSource,
        amount: Number(amount),
        note: String(note || ""),
        userId,
      });
      if (shouldMirror && this.MirrorIncomeModel) {
        await this.MirrorIncomeModel.create({
          date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
          source: trimmedSource,
          amount: Number(amount),
          note: String(note || ""),
          userId,
        });
      }
      savedCount++;
    }

    return { message: `Successfully saved ${savedCount} income records` };
  }

  /** ---------------------------------------------------
   * 🔹 MONTHLY CONSOLIDATED PIVOT (by source × month)
   * --------------------------------------------------- */
  async getMonthlyConsolidatedPivotTable(year: number, userId: string) {
    this.IncomeModel = await getIncomeModel();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const yearlyIncome = await this.IncomeModel.find({ userId, date: { $gte: start, $lte: end } });

    const sources = Array.from(new Set(yearlyIncome.map((e) => e.source).filter(Boolean))).sort();

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    // month → source → amount
    const monthlyData: Record<string, Record<string, number>> = {};
    for (const m of monthNames) {
      monthlyData[m] = {};
      sources.forEach((s) => (monthlyData[m][s] = 0));
    }

    yearlyIncome.forEach((rec) => {
      if (!rec?.date) return;
      const d = new Date(rec.date);
      if (isNaN(d.getTime())) return;
      const m = monthNames[d.getUTCMonth()];
      const s = rec.source;
      const amt = this.round(Number(rec.amount || 0));
      if (m && s && monthlyData[m]?.[s] !== undefined) {
        monthlyData[m][s] = this.round(monthlyData[m][s] + amt);
      }
    });

    const result = monthNames.map((month) => {
      const monthEntry: { source: string; amount: number }[] = [];
      let total = 0;
      sources.forEach((s) => {
        const amount = monthlyData[month][s] || 0;
        total += amount;
        monthEntry.push({ source: s, amount });
      });
      monthEntry.push({ source: "Total", amount: this.round(total) });
      return { month, data: monthEntry };
    });

    return { year, sources, months: result };
  }

  /** ---------------------------------------------------
   * 🔹 YEARLY CONSOLIDATED PIVOT (by source)
   * --------------------------------------------------- */
  async getYearlyConsolidatedPivotTable(year: number, userId: string) {
    this.IncomeModel = await getIncomeModel();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const records = await this.IncomeModel.find({ userId, date: { $gte: start, $lte: end } });
    const sources = Array.from(new Set(records.map((r) => r.source).filter(Boolean))).sort();

    const consolidated: Record<string, number> = {};
    sources.forEach((s) => (consolidated[s] = 0));

    records.forEach(({ source, amount }) => {
      if (!source) return;
      consolidated[source] = this.round((consolidated[source] || 0) + this.round(Number(amount || 0)));
    });

    const final: { source: string; amount: number }[] = sources.map((s) => ({
      source: s,
      amount: consolidated[s],
    }));
    const total = this.round(final.reduce((sum, r) => sum + r.amount, 0));
    final.push({ source: "Total", amount: total });

    return final;
  }

  /** ---------------------------------------------------
   * 🔹 FINANCIAL OVERVIEW — join income + expense pivot
   * Used by the Financial Insights page
   * --------------------------------------------------- */
  async getFinancialOverview(year: number, userId: string) {
    this.IncomeModel = await getIncomeModel();

    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    const allIncome = await this.IncomeModel.find({ userId, date: { $gte: start, $lte: end } });

    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];

    const incomeByMonth: Record<string, { total: number; investmentReturn: number }> = {};
    for (const m of monthNames) incomeByMonth[m] = { total: 0, investmentReturn: 0 };

    allIncome.forEach((rec) => {
      if (!rec?.date) return;
      const m = monthNames[new Date(rec.date).getUTCMonth()];
      const amt = this.round(Number(rec.amount || 0));
      incomeByMonth[m].total = this.round(incomeByMonth[m].total + amt);
      if (rec.source === "Investment Return") {
        incomeByMonth[m].investmentReturn = this.round(
          incomeByMonth[m].investmentReturn + amt,
        );
      }
    });

    return { year, incomeByMonth };
  }
}
