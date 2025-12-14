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

@Injectable()
export class ExpensesService implements OnModuleInit {
  private ExpensesModel!: Model<IExpenseDocument>;
  private ExpensesHistoryModel!: Model<IExpenseHistoryDocument>;
  private CategoriesModel!: Model<ICategoryDocument>;

  private statementService!: StatementParsingService;

  async onModuleInit() {
    this.ExpensesModel = await getExpenseModel();
    this.ExpensesHistoryModel = await getExpenseHistoryModel();
    this.CategoriesModel = await getCategoryModel();
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

    const monthlyExpenses = await this.ExpensesModel.find({
      userId,
      date: { $gte: start, $lte: end },
    });
    console.log({ userId, year, month, start, end, monthlyExpenses });

    const consolidatedData: Record<string, number> = {};

    const categories = (await this.CategoriesModel.find({ userId })).map((c) => c.category).sort();

    categories.forEach((cat) => (consolidatedData[cat] = 0));

    // Aggregate expenses
    monthlyExpenses.forEach(({ category, amount }) => {
      const roundedAmount = roundOff(Number(amount));
      consolidatedData[category] = roundOff((consolidatedData[category] || 0) + roundedAmount);
    });

    // Final list
    const finalData: ProcessedExpense[] = [];
    let total = 0;

    categories.forEach((category) => {
      finalData.push({
        category: category,
        amount: consolidatedData[category],
      });
      total += consolidatedData[category];
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

    await this.ExpensesModel.deleteMany({ date: { $gte: start, $lte: end } });

    for (let index = 0; index < data.length; index++) {
      const expense = data[index];

      const {
        date,
        category,
        amount,
        statementRecord = "Manual",
        statementType = "Unknown",
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

      await this.ExpensesHistoryModel.updateOne(
        { userId: value.userId, statementRecord: value.statementRecord },
        {
          $addToSet: { category: value.category },
          $setOnInsert: { statementType: value.statementType ?? "Unkown" },
        },
        { upsert: true },
      );
    }

    return { message: "Saved your monthly expense data" };
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
      await this.CategoriesModel.deleteMany({ userId });
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
        }),
      );
      return { message: "Saved your Categories data" };
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

    // Get date range for entire year
    const start = new Date(year, 0, 1); // Jan 1
    const end = new Date(year, 11, 31, 23, 59); // Dec 31 (end of day)

    // Fetch all expenses for year
    const expenses = await this.ExpensesModel.find({
      userId,
      date: { $gte: start, $lte: end },
    });

    // Fetch all categories
    const categories = (await this.CategoriesModel.find({ userId })).map((c) => c.category).sort();

    // Prepare consolidation store
    const consolidated: Record<string, number> = {};
    categories.forEach((c) => (consolidated[c] = 0));

    // Aggregate sums
    expenses.forEach(({ category, amount }) => {
      const val = round(Number(amount));
      consolidated[category] = round((consolidated[category] || 0) + val);
    });

    // Prepare final list
    const final: { category: string; amount: number }[] = [];
    let total = 0;

    for (const cat of categories) {
      final.push({
        category: cat,
        amount: consolidated[cat],
      });
      total += consolidated[cat];
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

    // Get all expenses for this user in the given year
    const yearlyExpenses = await this.ExpensesModel.find({
      userId,
      date: {
        $gte: new Date(year, 0, 1),
        $lte: new Date(year, 11, 31, 23, 59, 59),
      },
    });

    // Get all categories
    const categories = (await this.CategoriesModel.find({ userId })).map((c) => c.category).sort();

    // Prepare output structure
    // For each month → map category → amount
    const monthlyData: Record<string, Record<string, number>> = {};

    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date(2024, i, 1);
      return date.toLocaleString("default", { month: "long" });
    });

    for (const month of months) {
      monthlyData[month] = {};
      categories.forEach((cat) => (monthlyData[month][cat] = 0));
    }

    // Aggregate expenses
    yearlyExpenses.forEach((exp) => {
      const month = months[exp.date.getMonth()];
      const cat = exp.category;
      const amt = roundOff(Number(exp.amount));

      // Ensure it's a known category
      if (monthlyData[month][cat] !== undefined) {
        monthlyData[month][cat] = roundOff(monthlyData[month][cat] + amt);
      }
    });

    // Prepare final result
    const result = [];

    for (const month of months) {
      const monthEntry = [];

      let total = 0;

      categories.forEach((cat) => {
        const amount = monthlyData[month][cat];
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
