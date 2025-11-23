import { Injectable, OnModuleInit } from "@nestjs/common";
import { getExpenseModel, IExpenseDocument, validateExpense } from "./expenses.model";
import { getExpenseHistoryModel, IExpenseHistoryDocument } from "./expensesHistory.model";
import { Model } from "mongoose";
import {
  EStatementType,
  IProcessExpenseFileRequest,
  ProcessedExpense,
  ProcessExpenseFileResponse,
} from "common-types/dist/types/expenses";
import { StatementParsingService } from "./statements/statements.service";
import { ICategoryDocument, getCategoryModel } from "./expensesCategories.model";

@Injectable()
export class ExpensesService implements OnModuleInit {
  private ExpensesModel!: Model<IExpenseDocument>;
  private ExpensesHistoryModel!: Model<IExpenseHistoryDocument>;
  private CategoriesModel!: Model<ICategoryDocument>;

  private statementService!: StatementParsingService;

  async onModuleInit() {
    this.ExpensesModel = await getExpenseModel();
    this.ExpensesHistoryModel = await getExpenseHistoryModel();
    this.statementService = new StatementParsingService();

    this.CategoriesModel = await getCategoryModel();
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
      const categoriesData = (await this.CategoriesModel.find({ userId }))
        .map((c) => c.category)
        .sort();

      switch (body.statementType) {
        case EStatementType.sbiDebit:
          processedData = await this.statementService.processSBIDebitStatement(body, userId);
          return {
            processedData,
            categoriesData: categoriesData,
          };
        case EStatementType.hdfcDebit:
          processedData = await this.statementService.processHDFCDebitStatement(body, userId);
          return {
            processedData,
            categoriesData: categoriesData,
          };
        // case EStatementType.hdfcCredit:
        //   processedData = await this.statementService.processHDFCCreditStatement(body);

        default:
          return {
            processedData: [],
            categoriesData: [],
            error: { message: "Unsupported Bank Statement" },
          };
      }
    } catch (e: any) {
      return {
        processedData: [],
        categoriesData: [],
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

    const categoriesData = (await this.CategoriesModel.find({ userId }))
      .map((c) => c.category)
      .sort();

    categoriesData.forEach((cat) => (consolidatedData[cat] = 0));

    // Aggregate expenses
    monthlyExpenses.forEach(({ category, amount }) => {
      const roundedAmount = roundOff(Number(amount));
      consolidatedData[category] = roundOff((consolidatedData[category] || 0) + roundedAmount);
    });

    // Final list
    const finalData: ProcessedExpense[] = [];
    let total = 0;

    categoriesData.forEach((category) => {
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
  async getExpenseHistoryData() {
    return await this.ExpensesHistoryModel.find();
  }
}
