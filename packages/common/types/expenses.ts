export interface IExpense {
  userId: string;
  date: Date;
  category: string;
  amount: number;
  statementRecord?: string;
  statementType?: string;
}

export enum EStatementType {
  hdfcDebit = "HDFC_Debit",
  hdfcCredit = "HDFC_Credit",
  sbiDebit = "SBI_Debit",
  sbiCredit = "SBI_Credit",
  cubDebit = "CUB_Debit",
  unknown = "unknown",
}

export interface StatementFileMetadata {
  fullPath: string;
}
export interface IProcessExpenseFileRequest {
  month: number;
  year: number;
  statementType: string;
  statementFilesMetadata: StatementFileMetadata[];
}

export const statementDocumentOptions = [
  { value: EStatementType.hdfcDebit, label: "HDFC Bank Debit Statement" },
  { value: EStatementType.hdfcCredit, label: "HDFC Bank Credit Statement" },
  { value: EStatementType.sbiDebit, label: "SBI Bank Debit Statement" },
  { value: EStatementType.sbiCredit, label: "SBI Bank Credit Statement" },
  { value: EStatementType.cubDebit, label: "CUB Bank Debit Statement" },
  { value: EStatementType.unknown, label: "Unknown Bank Statement" },
];

export interface IExpensesCategorySchema {
  userId: string;
  category: string;
  keywords: string[];
}

export interface IExpensesCategory {
  category: string;
  keywords: string[];
}

export interface IExpenseHistory {
  userId: string;
  statementRecord: string;
  category: string[];
  statementType?: string;
}

export interface ProcessedExpense {
  date?: string;
  category: string;
  amount: number;
  statementRecord?: string;
  statementType?: EStatementType;
}

export interface ProcessExpenseFileResponse {
  processedData: ProcessedExpense[];
  error?: { message: string };
}
