export interface IExpense {
  userId: string;
  date: Date;
  category: string;
  amount: number;
  statementRecord?: string;
  statementType?: string;
}

export enum EStatementType {
  hdfcDebit = "hdfcDebit",
  hdfcCredit = "hdfcCredit",
  sbiDebit = "sbiDebit",
  sbiCredit = "sbiCredit",
}

export interface IProcessExpenseFileRequest {
  month: number;
  year: number;
  statementType: string;
  statementFileMetadata: {
    fullPath: string;
  };
}

export const statementDocumentOptions = [
  { value: EStatementType.hdfcDebit, label: "HDFC Bank Debit Statement" },
  { value: EStatementType.hdfcCredit, label: "HDFC Bank Credit Statement" },
  { value: EStatementType.sbiDebit, label: "SBI Bank Debit Statement" },
  { value: EStatementType.sbiCredit, label: "SBI Bank Credit Statement" },
];

export interface IExpenseCategory {
  userId: string;
  category: string;
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
  categoriesData: string[];
  error?: { message: string };
}
