import axios from "axios";
import {
  EStatementType,
  IProcessExpenseFileRequest,
  ProcessedExpense,
  StatementFileMetadata,
} from "../../../common-types/types/expenses";

import { BaseParser } from "./parsers/BaseParser";
import { SBIParser } from "./parsers/SBIParser";
import { HDFCParser } from "./parsers/HDFCParser";

import { FirebaseService } from "../../auth/firebase.service";
import { getExpenseHistoryModel, IExpenseHistoryDocument } from "../expensesHistory.model";

import { Model } from "mongoose";
import { HDFCCreditParser } from "./parsers/HDFCCreditParser";
import { getCategoryModel, ICategoryDocument } from "../expensesCategories.model";
import { AICategoryService } from "./ai.service";

export class StatementParsingService {
  private firebaseService;
  private ExpensesHistoryModel!: Model<IExpenseHistoryDocument>;
  private ExpensesCategoriesModel!: Model<ICategoryDocument>;
  private aiService: AICategoryService;

  constructor() {
    this.firebaseService = new FirebaseService();
    this.aiService = new AICategoryService();
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
        return new HDFCCreditParser(); // later replace with HDFCCreditParser
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
  public mapcategoryWithKeyword = async (comment: string, userId: string) => {
    if (!comment || !comment.trim()) {
      return { categoryWithKeyword: null, categoryMatchedWithKeyword: false };
    }

    const trimmedComment = comment.trim();
    const commentLower = trimmedComment.toLowerCase();

    this.ExpensesCategoriesModel = await getCategoryModel();

    const userCategories = (await this.ExpensesCategoriesModel.find({ userId })).map((x) => ({
      category: x.category,
      keywords: x.keywords || [],
    }));

    const systemKeywordsMap: Record<string, string[]> = {
      "Self Transfer": ["Self", "Self Transfer"],
      Split: ["Split"],
    };

    // 1️⃣ Exact match pass: User Categories
    for (const { category, keywords } of userCategories) {
      if (category.toLowerCase() === commentLower) {
        return {
          categoryWithKeyword: category,
          categoryMatchedWithKeyword: true,
        };
      }
      for (const keyword of keywords) {
        if (keyword.toLowerCase() === commentLower) {
          return {
            categoryWithKeyword: category,
            categoryMatchedWithKeyword: true,
          };
        }
      }
    }

    // 2️⃣ Exact match pass: System Keywords Map
    for (const [sysCategory, keywords] of Object.entries(systemKeywordsMap)) {
      if (sysCategory.toLowerCase() === commentLower) {
        return {
          categoryWithKeyword: sysCategory,
          categoryMatchedWithKeyword: true,
        };
      }
      for (const keyword of keywords) {
        if (keyword.toLowerCase() === commentLower) {
          return {
            categoryWithKeyword: sysCategory,
            categoryMatchedWithKeyword: true,
          };
        }
      }
    }

    // 3️⃣ Partial match pass: Collect matching categories
    const matchedCategories = new Set<string>();

    if (commentLower.length >= 3) {
      const commentPrefix = commentLower.substring(0, 3);

      for (const { category, keywords } of userCategories) {
        const catPrefix = category.toLowerCase().substring(0, 3);
        if (catPrefix === commentPrefix) {
          matchedCategories.add(category);
          continue;
        }

        for (const keyword of keywords) {
          const kwPrefix = keyword.toLowerCase().substring(0, 3);
          if (kwPrefix === commentPrefix) {
            matchedCategories.add(category);
            break;
          }
        }
      }

      for (const [sysCategory, keywords] of Object.entries(systemKeywordsMap)) {
        const sysCatPrefix = sysCategory.toLowerCase().substring(0, 3);
        if (sysCatPrefix === commentPrefix) {
          matchedCategories.add(sysCategory);
          continue;
        }

        for (const keyword of keywords) {
          const kwPrefix = keyword.toLowerCase().substring(0, 3);
          if (kwPrefix === commentPrefix) {
            matchedCategories.add(sysCategory);
            break;
          }
        }
      }
    }

    // 4️⃣ Return partial matches combined with original comment text
    if (matchedCategories.size > 0) {
      const resultList = Array.from(matchedCategories);
      const isCommentAlreadyIncluded = resultList.some((cat) => cat.toLowerCase() === commentLower);

      if (!isCommentAlreadyIncluded) {
        resultList.push(trimmedComment);
      }

      return {
        categoryWithKeyword: resultList.join(" / ").trim(),
        categoryMatchedWithKeyword: true,
      };
    }

    return { categoryWithKeyword: null, categoryMatchedWithKeyword: false };
  };

  private async mapCategoryWithStatementRecord(statementRecord: string, userId: string) {
    this.ExpensesHistoryModel = await getExpenseHistoryModel();

    const history = await this.ExpensesHistoryModel.find({ userId, statementRecord });

    if (history.length === 0)
      return { categoryWithStatementRecord: "Unknown", categoryMatchedWithStatementRecord: false };

    return {
      categoryWithStatementRecord: history
        .map((h) => h.category.join(" / "))
        .join(" ")
        .trim(),
      categoryMatchedWithStatementRecord: true,
    };
  }

  private async suggestCategoryWithAI(
    comment: string,
    statementRecord: string,
    userId: string,
  ): Promise<string> {
    if (process.env.ENABLE_AI_CATEGORIZATION !== "true") {
      return "Unknown";
    }

    try {
      this.ExpensesCategoriesModel = await getCategoryModel();
      const categories = (await this.ExpensesCategoriesModel.find({ userId })).map(
        (x) => x.category,
      );
      if (categories.length === 0) return "Unknown";

      const suggested = await this.aiService.suggestCategory(comment, statementRecord, categories);
      return suggested !== "Unknown" ? `AI: ${suggested}` : "AI: Unknown";
    } catch (e) {
      console.error("suggestCategoryWithAI failure:", e);
      return "Unknown";
    }
  }

  private async mapCategory(
    comment: string,
    statementRecord: string,
    userId: string,
  ): Promise<string> {
    const { categoryWithKeyword, categoryMatchedWithKeyword } = await this.mapcategoryWithKeyword(
      comment,
      userId,
    );

    if (categoryMatchedWithKeyword && categoryWithKeyword) return categoryWithKeyword;

    const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
      await this.mapCategoryWithStatementRecord(statementRecord, userId);

    if (categoryMatchedWithStatementRecord) return categoryWithStatementRecord;

    return this.suggestCategoryWithAI(comment, statementRecord, userId);
  }

  private processStatementFile = async (
    body: IProcessExpenseFileRequest,
    statementFileMetadata: StatementFileMetadata,
    statementType: EStatementType,
  ) => {
    const url = await this.firebaseService.getDownloadUrlFromFirebaseStorageBucket(
      statementFileMetadata.fullPath,
    );

    const { data } = await axios.get<ArrayBuffer>(url, { responseType: "arraybuffer" });

    const parsedRows = await this.parseStatement(statementType, data);

    // await this.firebaseService.deleteFileFromStorage(statementFileMetadata.fullPath);

    const targetMonth = Number(body.month); // 1–12
    const targetYear = Number(body.year); // 2025

    return { parsedRows, targetMonth, targetYear };
  };

  /* ------------------------------------------------------------
   * ✅ SBI DEBIT PROCESSOR
   * ------------------------------------------------------------ */
  public processSBIDebitStatement = async (
    body: IProcessExpenseFileRequest,
    userId: string,
  ): Promise<ProcessedExpense[]> => {
    const processedData: ProcessedExpense[] = (
      await Promise.all(
        body.statementFilesMetadata.map(
          async (statementFileMetadata): Promise<ProcessedExpense[]> => {
            const fileData: ProcessedExpense[] = [];
            const { parsedRows, targetMonth, targetYear } = await this.processStatementFile(
              body,
              statementFileMetadata,
              EStatementType.sbiDebit,
            );
            for (const row of parsedRows) {
              const { txnDate, description, debitAmount } = row;

              if (!row || !txnDate || !debitAmount) continue;

              const d = new Date(txnDate);
              if (d.getMonth() !== targetMonth || d.getFullYear() !== targetYear) {
                continue;
              }

              const parts = description.replace(/^-+|-+$/g, "").split("/");

              // ✅ Case 1: TO TRANSFER / ... / ... pattern
              if (parts.length > 1 && parts[0].startsWith("TO")) {
                const comment = parts.at(-1) || "";
                const statementRecord = parts.slice(3).join("->");
                const category = await this.mapCategory(comment, statementRecord, userId);

                fileData.push({
                  date: txnDate,
                  category: category,
                  amount: debitAmount,
                  statementRecord: statementRecord,
                  statementType: EStatementType.sbiDebit,
                });
              }

              // ✅ Case 2: Other transaction descriptions
              else {
                const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
                  await this.mapCategoryWithStatementRecord(description, userId);

                let category = categoryWithStatementRecord;
                if (!categoryMatchedWithStatementRecord) {
                  category = await this.suggestCategoryWithAI("", description, userId);
                }

                fileData.push({
                  date: txnDate,
                  category: category,
                  amount: debitAmount,
                  statementRecord: description,
                  statementType: EStatementType.sbiDebit,
                });
              }
            }
            return fileData;
          },
        ),
      )
    ).flat();
    return processedData;
  };

  /* ------------------------------------------------------------
   * ✅ HDFC Debit
   * ------------------------------------------------------------ */
  public processHDFCDebitStatement = async (
    body: IProcessExpenseFileRequest,
    userId: string,
  ): Promise<ProcessedExpense[]> => {
    const processedData: ProcessedExpense[] = (
      await Promise.all(
        body.statementFilesMetadata.map(
          async (statementFileMetadata): Promise<ProcessedExpense[]> => {
            const fileData: ProcessedExpense[] = [];
            const { parsedRows, targetMonth, targetYear } = await this.processStatementFile(
              body,
              statementFileMetadata,
              EStatementType.hdfcDebit,
            );

            for (const row of parsedRows) {
              const { txnDate, description, debitAmount } = row;
              if (!txnDate || !debitAmount) continue;

              // ---------------------------------------------------------
              // ✅ Month-Year Filter
              // ---------------------------------------------------------
              const d = new Date(txnDate);
              if (d.getMonth() !== targetMonth || d.getFullYear() !== targetYear) {
                continue;
              }

              //
              const parts = description.split("-");

              // ✅ Case 1: below patterns match
              // IMPS-506823333166-P AJAY-SBIN-XXXXXXX1725-MARCH EXPENSE
              // UPI-MALARVIZHI B-MALARVIZHI2705@OKICICI-SBIN0010412-107228132454-HAIHELLO
              if (parts.length > 1) {
                const comment = parts.at(-1) || "";
                parts.splice(parts.length - 2, 1); // Removing transaction ID from statement record
                const statementRecord = parts.join("->");
                const category = await this.mapCategory(comment, statementRecord, userId);

                fileData.push({
                  date: row.txnDate,
                  category,
                  amount: row.debitAmount,
                  statementRecord: statementRecord,
                  statementType: EStatementType.hdfcDebit,
                });

                // ✅ Case 2: Other transaction descriptions
              } else {
                const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
                  await this.mapCategoryWithStatementRecord(description, userId);

                let category = categoryWithStatementRecord;
                if (!categoryMatchedWithStatementRecord) {
                  category = await this.suggestCategoryWithAI("", description, userId);
                }

                fileData.push({
                  date: row.txnDate,
                  category,
                  amount: row.debitAmount,
                  statementRecord: description,
                  statementType: EStatementType.hdfcDebit,
                });
              }
            }
            return fileData;
          },
        ),
      )
    ).flat();
    return processedData;
  };

  /* ------------------------------------------------------------
   * ✅ HDFC CREDIT
   * ------------------------------------------------------------ */
  public processHDFCCreditStatement = async (
    body: IProcessExpenseFileRequest,
    userId: string,
  ): Promise<ProcessedExpense[]> => {
    const processedData: ProcessedExpense[] = (
      await Promise.all(
        body.statementFilesMetadata.map(
          async (statementFileMetadata): Promise<ProcessedExpense[]> => {
            const fileData: ProcessedExpense[] = [];

            const { parsedRows, targetMonth, targetYear } = await this.processStatementFile(
              body,
              statementFileMetadata,
              EStatementType.hdfcCredit,
            );

            for (const row of parsedRows) {
              const { txnDate, description, debitAmount } = row;

              if (!txnDate || !debitAmount) continue;

              // ---------------------------------------------------------
              // ✅ Month-Year Filter
              // ---------------------------------------------------------
              const d = new Date(txnDate);
              if (d.getMonth() !== targetMonth || d.getFullYear() !== targetYear) {
                continue;
              }

              // ---------------------------------------------------------
              // ✅ Case 1: Fallback classification via full text match
              // ---------------------------------------------------------

              const { categoryWithStatementRecord, categoryMatchedWithStatementRecord } =
                await this.mapCategoryWithStatementRecord(description, userId);

              let category = categoryWithStatementRecord;
              if (!categoryMatchedWithStatementRecord) {
                category = await this.suggestCategoryWithAI("", description, userId);
              }

              fileData.push({
                date: txnDate,
                category,
                amount: debitAmount,
                statementRecord: description,
                statementType: EStatementType.hdfcCredit,
              });
            }
            return fileData;
          },
        ),
      )
    ).flat();

    return processedData;
  };
}
