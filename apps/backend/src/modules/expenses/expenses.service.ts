import { Injectable, OnModuleInit } from "@nestjs/common";
import { getExpenseModel, IExpenseDocument, validateExpense } from "./expenses.model";
import { getExpenseHistoryModel, IExpenseHistoryDocument } from "./expensesHistory.model";
import { Model } from "mongoose";
import {
  EStatementType,
  IExpensesCategory,
  IProcessExpenseFileRequest,
  ProcessedExpense,
  ProcessExpenseFileResponse,
} from "../../common-types/types/expenses";
import { StatementParsingService } from "./statements/statements.service";
import { ICategoryDocument, getCategoryModel, validateCategory } from "./expensesCategories.model";
import { shouldMirrorUser } from "../../mongo/mirror-users";

@Injectable()
export class ExpensesService implements OnModuleInit {
  private ExpensesModel!: Model<IExpenseDocument>;
  private ExpensesHistoryModel!: Model<IExpenseHistoryDocument>;
  private CategoriesModel!: Model<ICategoryDocument>;
  private MirrorExpensesModel?: Model<IExpenseDocument>;
  private MirrorExpensesHistoryModel?: Model<IExpenseHistoryDocument>;
  private MirrorCategoriesModel?: Model<ICategoryDocument>;

  private statementService!: StatementParsingService;

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

    this.MirrorExpensesModel = await getExpenseModel(mirrorDbName);
    this.MirrorExpensesHistoryModel = await getExpenseHistoryModel(mirrorDbName);
    this.MirrorCategoriesModel = await getCategoryModel(mirrorDbName);
  }

  async onModuleInit() {
    this.ExpensesModel = await getExpenseModel();
    this.ExpensesHistoryModel = await getExpenseHistoryModel();
    this.CategoriesModel = await getCategoryModel();
    await this.initializeMirrorModels();
    this.statementService = new StatementParsingService();
  }

  /** ---------------------------------------------------
   * 🔹 PROCESS EXPENSE STATEMENT FILE
   * --------------------------------------------------- */
  async processMonthlyExpenseStatements(
    body: IProcessExpenseFileRequest,
    userId: string,
  ): Promise<ProcessExpenseFileResponse> {
    try {
      let processedData: ProcessedExpense[] = [];

      switch (body.statementType) {
        case EStatementType.sbiDebit:
          processedData = await this.statementService.processSBIDebitStatement(body, userId);
          return {
            processedData,
          };
        case EStatementType.hdfcDebit:
          processedData = await this.statementService.processHDFCDebitStatement(body, userId);
          return {
            processedData,
          };
        case EStatementType.hdfcCredit:
          processedData = await this.statementService.processHDFCCreditStatement(body, userId);
          return {
            processedData,
          };
        default:
          return {
            processedData: [],
            error: { message: "Unsupported Bank Statement" },
          };
      }
    } catch (e: any) {
      return {
        processedData: [],
        error: { message: e.message },
      };
    }
  }
  getMonthRange = (year: number, month: number) => {
    return {
      start: new Date(year, month, 1),
      end: new Date(year, month + 1, 0, 23, 59, 59, 999),
    };
  };

  /** ---------------------------------------------------
   * 🔹 PROCESS MANUAL EXPENSE DATA (AGGREGATED)
   * --------------------------------------------------- */
  async getMonthlyExpensesPivotTable(
    query: {
      year: number;
      month: number;
    },
    userId: string,
  ): Promise<ProcessedExpense[]> {
    const roundOff = (val: number): number =>
      Math.round((parseFloat(val.toString()) + Number.EPSILON) * 100) / 100;

    const { year, month } = query;

    const { start, end } = this.getMonthRange(year, month);

    this.ExpensesModel = await getExpenseModel();
    this.CategoriesModel = await getCategoryModel();

    const monthlyExpenses = await this.ExpensesModel.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    const configuredCategories = (await this.CategoriesModel.find({ userId }))
      .map((c) => c.category)
      .filter(Boolean);
    const actualCategories = monthlyExpenses.map((e) => e.category).filter(Boolean);
    const categories = Array.from(new Set([...configuredCategories, ...actualCategories])).sort();

    const consolidatedData: Record<string, number> = {};
    categories.forEach((cat) => (consolidatedData[cat] = 0));

    // Aggregate expenses
    monthlyExpenses.forEach(({ category, amount }) => {
      if (!category) return;
      const roundedAmount = roundOff(Number(amount || 0));
      consolidatedData[category] = roundOff((consolidatedData[category] || 0) + roundedAmount);
    });

    // Final list
    const finalData: ProcessedExpense[] = [];
    let total = 0;

    categories.forEach((category) => {
      finalData.push({
        category: category,
        amount: consolidatedData[category] || 0,
      });
      total += consolidatedData[category] || 0;
    });

    // Append Total
    finalData.push({
      category: "Total",
      amount: roundOff(total),
    });

    return finalData;
  }

  /** ---------------------------------------------------
   * 🔹 SAVE FINAL EXPENSE DATA INTO DB
   * --------------------------------------------------- */
  async saveMonthlyExpenseData(body: any, userId: string) {
    const data = body.expenseData;
    const month = body.month;
    const year = body.year;

    const { start, end } = this.getMonthRange(year, month);
    const shouldMirror = shouldMirrorUser(userId);

    await this.ExpensesModel.deleteMany({ userId, date: { $gte: start, $lte: end } });
    if (shouldMirror && this.MirrorExpensesModel) {
      await this.MirrorExpensesModel.deleteMany({ userId, date: { $gte: start, $lte: end } });
    }

    for (let index = 0; index < data.length; index++) {
      const expense = data[index];

      const {
        date,
        category,
        amount,
        statementRecord = "Manual",
        statementType = EStatementType.unknown,
      } = expense;

      const { value, error } = validateExpense(
        {
          userId,
          date,
          category,
          amount,
          statementRecord,
          statementType,
        },
        start,
        end,
      );

      if (error) {
        throw new Error(`Invalid data in row ${index}: ${error.details[0].message}`);
      }

      await this.ExpensesModel.create({
        ...value,
        userId,
      });

      if (shouldMirror && this.MirrorExpensesModel) {
        await this.MirrorExpensesModel.create({
          ...value,
          userId,
        });
      }

      await this.ExpensesHistoryModel.updateOne(
        { userId: value.userId, statementRecord: value.statementRecord },
        {
          $addToSet: { category: value.category },
          $setOnInsert: { statementType: value.statementType ?? "Unkown" },
        },
        { upsert: true },
      );

      if (shouldMirror && this.MirrorExpensesHistoryModel) {
        await this.MirrorExpensesHistoryModel.updateOne(
          { userId: value.userId, statementRecord: value.statementRecord },
          {
            $addToSet: { category: value.category },
            $setOnInsert: { statementType: value.statementType ?? "Unkown" },
          },
          { upsert: true },
        );
      }
    }
    const monthName = new Date(year, month).toLocaleString("en-US", {
      month: "long",
    });
    return { message: `Saved ${year} ${monthName} month expense data` };
  }

  async getMonthlyExpenseData(body: any, userId: string) {
    const month = parseInt(body.month);
    const year = parseInt(body.year);

    const { start, end } = this.getMonthRange(year, month);

    const monthlyExpenses = await this.ExpensesModel.find({
      userId,
      date: { $gte: start, $lte: end },
    });
    return monthlyExpenses.map((x) => {
      return {
        date: x.date,
        category: x.category,
        amount: x.amount,
        statementRecord: x.statementRecord,
        statementType: x.statementType,
      };
    });
  }

  async getExpenseDataByRange(
    body: { startYear?: number; startMonth?: number; endYear?: number; endMonth?: number; allData?: boolean },
    userId: string,
  ) {
    this.ExpensesModel = await getExpenseModel();
    const { startYear, startMonth, endYear, endMonth, allData } = body;

    let query: any = { userId };

    if (!allData && startYear && endYear && startMonth !== undefined && endMonth !== undefined) {
      const start = new Date(startYear, startMonth, 1);
      const end = new Date(endYear, endMonth + 1, 0, 23, 59, 59, 999);
      query.date = { $gte: start, $lte: end };
    }

    const expenses = await this.ExpensesModel.find(query).sort({ date: -1 });

    return expenses.map((x) => {
      const d = new Date(x.date);
      const dateStr = !isNaN(d.getTime()) ? d.toISOString().split("T")[0] : x.date;
      return {
        id: (x as any)._id?.toString() || crypto.randomUUID(),
        date: dateStr,
        category: x.category,
        amount: x.amount,
        statementRecord: x.statementRecord,
        statementType: x.statementType,
      };
    });
  }

  async saveBulkExpenseData(body: { expenseData: any[] }, userId: string) {
    const { expenseData } = body;
    this.ExpensesModel = await getExpenseModel();
    this.ExpensesHistoryModel = await getExpenseHistoryModel();
    await this.initializeMirrorModels();
    const shouldMirror = shouldMirrorUser(userId);

    let savedCount = 0;
    for (const expense of expenseData) {
      const {
        date,
        category,
        amount,
        statementRecord = "Manual",
        statementType = EStatementType.unknown,
      } = expense;

      if (!date || !category || amount === undefined) {
        continue;
      }

      const parsedDate = new Date(date);

      await this.ExpensesModel.create({
        date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
        category,
        amount: Number(amount),
        statementRecord,
        statementType,
        userId,
      });

      if (shouldMirror && this.MirrorExpensesModel) {
        await this.MirrorExpensesModel.create({
          date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
          category,
          amount: Number(amount),
          statementRecord,
          statementType,
          userId,
        });
      }

      await this.ExpensesHistoryModel.updateOne(
        { userId, statementRecord },
        {
          $addToSet: { category },
          $setOnInsert: { statementType: statementType ?? "Unknown" },
        },
        { upsert: true },
      );

      if (shouldMirror && this.MirrorExpensesHistoryModel) {
        await this.MirrorExpensesHistoryModel.updateOne(
          { userId, statementRecord },
          {
            $addToSet: { category },
            $setOnInsert: { statementType: statementType ?? "Unknown" },
          },
          { upsert: true },
        );
      }
      savedCount++;
    }

    return { message: `Successfully saved ${savedCount} expense records` };
  }

  /** ---------------------------------------------------
   * 🔹 FETCH EXPENSE HISTORY
   * --------------------------------------------------- */
  async getExpenseHistoryData(userId: string) {
    return await this.ExpensesHistoryModel.find({ userId });
  }

  async getCategories(userId: string): Promise<IExpensesCategory[]> {
    const categories: IExpensesCategory[] = (await this.CategoriesModel.find({ userId }))
      .map((c) => ({ category: c.category, keywords: c.keywords }))
      .sort();
    return categories;
  }

  async saveCategories(body: any, userId: string) {
    try {
      const shouldMirror = shouldMirrorUser(userId);
      await this.CategoriesModel.deleteMany({ userId });
      if (shouldMirror && this.MirrorCategoriesModel) {
        await this.MirrorCategoriesModel.deleteMany({ userId });
      }
      await Promise.all(
        body.categories.map(async (eachCategory: any, index: number) => {
          const { category, keywords } = eachCategory;

          const { error } = validateCategory({
            userId,
            category,
            keywords,
          });
          if (error) {
            throw new Error(`Invalid data in row ${index}: ${error.details[0].message}`);
          }
          await this.CategoriesModel.create({
            category,
            keywords,
            userId,
          });

          if (shouldMirror && this.MirrorCategoriesModel) {
            await this.MirrorCategoriesModel.create({
              category,
              keywords,
              userId,
            });
          }
        }),
      );
      return { message: "Saved Categories data" };
    } catch (error: any) {
      return { error: `Error saving categories: ${error?.message}` };
    }
  }

  async getYearlyConsolidatedPivotTable(
    year: number,
    userId: string,
  ): Promise<{ category: string; amount: number }[]> {
    const round = (v: number) =>
      Math.round((parseFloat(v.toString()) + Number.EPSILON) * 100) / 100;

    this.ExpensesModel = await getExpenseModel();
    this.CategoriesModel = await getCategoryModel();

    // Get UTC date range for entire year
    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Fetch all expenses for year
    const expenses = await this.ExpensesModel.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    // Collect all categories (configured + actual)
    const configuredCategories = (await this.CategoriesModel.find({ userId }))
      .map((c) => c.category)
      .filter(Boolean);
    const actualCategories = expenses.map((e) => e.category).filter(Boolean);
    const categories = Array.from(new Set([...configuredCategories, ...actualCategories])).sort();

    // Prepare consolidation store
    const consolidated: Record<string, number> = {};
    categories.forEach((c) => (consolidated[c] = 0));

    // Aggregate sums
    expenses.forEach(({ category, amount }) => {
      if (!category) return;
      const val = round(Number(amount || 0));
      consolidated[category] = round((consolidated[category] || 0) + val);
    });

    // Prepare final list
    const final: { category: string; amount: number }[] = [];
    let total = 0;

    for (const cat of categories) {
      final.push({
        category: cat,
        amount: consolidated[cat] || 0,
      });
      total += consolidated[cat] || 0;
    }

    final.push({
      category: "Total",
      amount: round(total),
    });

    return final;
  }

  async getMonthlyConsolidatedPivotTable(year: number, userId: string) {
    const roundOff = (val: number): number =>
      Math.round((parseFloat(val.toString()) + Number.EPSILON) * 100) / 100;

    this.ExpensesModel = await getExpenseModel();
    this.CategoriesModel = await getCategoryModel();

    const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

    // Get all expenses for this user in the given year
    const yearlyExpenses = await this.ExpensesModel.find({
      userId,
      date: {
        $gte: start,
        $lte: end,
      },
    });

    // Collect all categories (configured + actual)
    const configuredCategories = (await this.CategoriesModel.find({ userId }))
      .map((c) => c.category)
      .filter(Boolean);
    const actualCategories = yearlyExpenses.map((e) => e.category).filter(Boolean);
    const categories = Array.from(new Set([...configuredCategories, ...actualCategories])).sort();

    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // For each month → map category → amount
    const monthlyData: Record<string, Record<string, number>> = {};

    for (const month of months) {
      monthlyData[month] = {};
      categories.forEach((cat) => (monthlyData[month][cat] = 0));
    }

    // Aggregate expenses
    yearlyExpenses.forEach((exp) => {
      if (!exp?.date) return;
      const d = new Date(exp.date);
      if (isNaN(d.getTime())) return;
      const month = months[d.getUTCMonth()];
      const cat = exp?.category;
      const amt = roundOff(Number(exp?.amount || 0));

      if (month && cat && monthlyData[month] && monthlyData[month][cat] !== undefined) {
        monthlyData[month][cat] = roundOff(monthlyData[month][cat] + amt);
      }
    });

    // Prepare final result
    const result = [];

    for (const month of months) {
      const monthEntry = [];
      let total = 0;

      categories.forEach((cat) => {
        const amount = monthlyData[month][cat] || 0;
        total += amount;

        monthEntry.push({
          category: cat,
          amount,
        });
      });

      // Add monthly total
      monthEntry.push({
        category: "Total",
        amount: roundOff(total),
      });

      result.push({
        month: month,
        data: monthEntry,
      });
    }

    return {
      year,
      categories,
      months: result,
    };
  }
}
