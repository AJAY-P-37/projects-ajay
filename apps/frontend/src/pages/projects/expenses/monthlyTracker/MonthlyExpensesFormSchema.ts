import { z } from "zod";

// ---------------- ZOD SCHEMA ----------------
const statementItemSchema = z.object({
  type: z.string().min(1, "Please select a statement type"),
  file: z
    .array(z.instanceof(File, { message: "Please upload a file" }))
    .min(1, "Add at least one file"),
});

export const expensesSchema = z.object({
  month: z.string().min(1, "Please select a month"),
  year: z.string().min(1, "Please select a year"),
  statements: z.array(statementItemSchema).min(1, "Add at least one statement"),
});

const month = new Date().getMonth();
const year = new Date().getFullYear();
export const currentMonth = String(month === 0 ? 11 : month - 1);
export const months = Array.from({ length: 12 }, (_, i) => {
  const date = new Date(2024, i, 1);
  return { value: String(i), label: date.toLocaleString("default", { month: "long" }) };
});

export const currentYear = String(month === 0 ? year - 1 : year);
export const years = Array.from({ length: 4 }, (_, i) => {
  const year = Number(currentYear) - i;
  return { value: String(year), label: String(year) };
});
export const currentMonthName = new Date(
  month === 0 ? year - 1 : year,
  month === 0 ? 11 : month - 1,
  1,
).toLocaleString("default", {
  month: "long",
});

export type ExpensesFormData = z.infer<typeof expensesSchema>;
