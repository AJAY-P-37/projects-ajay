import axios from "axios";
import {
  EStatementType,
  IProcessExpenseFileRequest,
  ProcessedExpense,
} from "common-types/dist/types/expenses";

import { BaseParser } from "./parsers/BaseParser";
import { SBIParser } from "./parsers/SBIParser";
import { HDFCParser } from "./parsers/HDFCParser";

import { FirebaseService } from "../../auth/firebase.service";
import { getExpenseHistoryModel, IExpenseHistoryDocument } from "../expensesHistory.model";

import { Model } from "mongoose";

export class StatementParsingService {
  private firebaseService;
  private ExpensesHistoryModel!: Model<IExpenseHistoryDocument>;

  constructor() {
    this.firebaseService = new FirebaseService();
  }

  /* ------------------------------------------------------------
   * ✅ PARSER FACTORY
   * ------------------------------------------------------------ */
  private getParser(type: EStatementType): BaseParser {
    switch (type) {
      case EStatementType.sbiDebit:
        return new SBIParser();

      case EStatementType.hdfcDebit:
        return new HDFCParser();

      case EStatementType.hdfcCredit:
        return new HDFCParser(); // later replace with HDFCCreditParser
    }

    throw new Error(`Unsupported statement type: ${type}`);
  }

  async parseStatement(type: EStatementType, buffer: ArrayBuffer) {
    const parser = this.getParser(type);
    return parser.parse(buffer);
  }

  /* ------------------------------------------------------------
   * ✅ CATEGORY HELPERS
   * ------------------------------------------------------------ */
  public mapCategoryWithComment(comment: string) {
    const commentsMap: Record<string, string> = {
      Breakfast: "Food",
      Lunch: "Food",
      Dinner: "Food",
      Food: "Food",
      Bike: "Bike",
      Haircut: "Others",
      Others: "Others",
      Family: "Family",
      Gym: "Gym",
      Health: "Health",
      Investment: "Investment",
      Movie: "Movie",
      Outing: "Outing",
      Rent: "Rent",
      Shopping: "Shopping",
      Snacks: "Snacks",
      Rapido: "Travel",
      Train: "Travel",
      Travel: "Travel",
      Contribution: "Contribution",
    };

    for (const key of Object.keys(commentsMap)) {
      if (key.substring(0, 3).toLowerCase() === comment.substring(0, 3).toLowerCase()) {
        return {
          categoryWithComment: commentsMap[key],
          categoryMatchedWithComment: true,
        };
      }
    }

    return { categoryWithComment: null, categoryMatchedWithComment: false };
  }

  private async mapCategoryWithStatementRecord(statementRecord: string, userId: string) {
    this.ExpensesHistoryModel = await getExpenseHistoryModel();

    const history = await this.ExpensesHistoryModel.find({ userId, statementRecord });

    if (history.length === 0)
      return { categoryWithStatementRecord: "", categoryMatchedWithStatementRecord: false };

    return {
      categoryWithStatementRecord: history
        .map((h) => h.category.join(" / "))
        .join(" ")
        .trim(),
      categoryMatchedWithStatementRecord: true,
    };
  }

  private async mapCategory(
    comment: string,
    statementRecord: string,
    userId: string,
  ): Promise<string> {
    const { categoryWithComment, categoryMatchedWithComment } =
      this.mapCategoryWithComment(comment);

    if (categoryMatchedWithComment && categoryWithComment) return categoryWithComment;

    const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
      await this.mapCategoryWithStatementRecord(statementRecord, userId);

    if (categoryMatchedWithStatementRecord) return categoryWithStatementRecord;

    return comment;
  }

  /* ------------------------------------------------------------
   * ✅ SBI DEBIT PROCESSOR
   * ------------------------------------------------------------ */
  public processSBIDebitStatement = async (
    body: IProcessExpenseFileRequest,
    userId: string,
  ): Promise<ProcessedExpense[]> => {
    const url = await this.firebaseService.getDownloadUrlFromFirebaseStorageBucket(
      body.statementFileMetadata.fullPath,
    );

    const { data } = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });

    const parsedRows = await this.parseStatement(EStatementType.sbiDebit, data);
    const processedData: ProcessedExpense[] = [];

    for (const row of parsedRows) {
      if (!row || !row.txnDate || !row.debitAmount) continue;

      const description = row.description;
      const parts = description.split("/");

      // ✅ Case 1: TO TRANSFER / ... / ... pattern
      if (parts.length > 1 && parts[0].startsWith("TO")) {
        const comment = parts.at(-1) || "";
        const statementRecord = parts.slice(3).join("->");
        const category = await this.mapCategory(comment, statementRecord, userId);

        processedData.push({
          date: row.txnDate,
          category: category,
          amount: row.debitAmount,
          statementRecord: statementRecord,
          statementType: EStatementType.sbiDebit,
        });
      }

      // ✅ Case 2: Other transaction descriptions
      else {
        const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
          await this.mapCategoryWithStatementRecord(description, userId);

        processedData.push({
          date: row.txnDate,
          category: categoryMatchedWithStatementRecord ? categoryWithStatementRecord : description,
          amount: row.debitAmount,
          statementRecord: description,
          statementType: EStatementType.sbiDebit,
        });
      }
    }

    return processedData;
  };

  /* ------------------------------------------------------------
   * ✅ HDFC Debit
   * ------------------------------------------------------------ */
  public processHDFCDebitStatement = async (
    body: IProcessExpenseFileRequest,
    userId: string,
  ): Promise<ProcessedExpense[]> => {
    const url = await this.firebaseService.getDownloadUrlFromFirebaseStorageBucket(
      body.statementFileMetadata.fullPath,
    );

    const { data } = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });
    const rows = await this.parseStatement(EStatementType.hdfcDebit, data);
    const processedData: ProcessedExpense[] = [];

    for (const row of rows) {
      const { txnDate, description, debitAmount } = row;
      if (!txnDate || !debitAmount) continue;

      //
      const parts = description.split("-");

      // ✅ Case 1: below patterns match
      // IMPS-506823333166-P AJAY-SBIN-XXXXXXX1725-MARCH EXPENSE
      // UPI-MALARVIZHI B-MALARVIZHI2705@OKICICI-SBIN0010412-107228132454-HAIHELLO
      if (parts.length > 1) {
        const comment = parts.at(-1) || "";
        const statementRecord = parts.join("->");
        const category = await this.mapCategory(comment, statementRecord, userId);

        processedData.push({
          date: row.txnDate,
          category: category,
          amount: row.debitAmount,
          statementRecord: statementRecord,
          statementType: EStatementType.hdfcDebit,
        });

        // ✅ Case 2: Other transaction descriptions
      } else {
        const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
          await this.mapCategoryWithStatementRecord(description, userId);

        processedData.push({
          date: row.txnDate,
          category: categoryMatchedWithStatementRecord ? categoryWithStatementRecord : description,
          amount: row.debitAmount,
          statementRecord: description,
          statementType: EStatementType.hdfcDebit,
        });
      }
    }
    return processedData;
  };

  /* ------------------------------------------------------------
   * ✅ HDFC CREDIT (Stub)
   * ------------------------------------------------------------ */
  //   public processHDFCCreditStatement = async (body: IProcessExpenseFileRequest) => {
  //     throw new Error("HDFC Credit parser not implemented yet");
  //   };
}
