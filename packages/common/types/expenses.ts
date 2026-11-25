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
  { value: EStatementType.hdfcDebit, label: "HDFC Bank Debit Statement", supported: true },
  { value: EStatementType.hdfcCredit, label: "HDFC Bank Credit Statement", supported: true },
  { value: EStatementType.sbiDebit, label: "SBI Bank Debit Statement", supported: true },
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
  id?: string;
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

export interface AICategorizeExpenseItem {
  id: string;
  statementRecord: string;
  currentCategory?: string;
  amount?: number;
}

export interface AICategorizeExpensesRequest {
  items: AICategorizeExpenseItem[];
}

export interface AICategorizedExpenseResult {
  id: string;
  category: string;
}

export interface AICategorizeExpensesResponse {
  results: AICategorizedExpenseResult[];
  error?: { message: string };
}

// ============================================================
// 💰 INCOME TYPES
// ============================================================

export enum EIncomeSource {
  salary = "Salary",
  freelance = "Freelance",
  investmentReturn = "Investment Return",
  rental = "Rental",
  gift = "Gift",
  other = "Other",
}

export const incomeSourceOptions = [
  { value: EIncomeSource.salary, label: "Salary" },
  { value: EIncomeSource.freelance, label: "Freelance" },
  { value: EIncomeSource.investmentReturn, label: "Investment Return" },
  { value: EIncomeSource.rental, label: "Rental" },
  { value: EIncomeSource.gift, label: "Gift" },
  { value: EIncomeSource.other, label: "Other" },
];

export interface IIncome {
  userId?: string;
  date: Date;
  source: string;   // EIncomeSource or custom user-defined source
  amount: number;
  note?: string;
}

export interface IIncomeSourceSchema {
  userId: string;
  source: string;
  description?: string;
}

export interface IIncomeSource {
  source: string;
  description?: string;
}

// ============================================================
// ⚙️ USER SETTINGS TYPES
// ============================================================

export interface IUserSettings {
  startYear: number;
  initialBalance: number;
}
