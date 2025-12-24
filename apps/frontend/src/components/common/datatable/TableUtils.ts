import { ColumnDef } from "@tanstack/react-table";
import { ZodSchema } from "zod";
import { TableErrors } from "./DataTable";
import { RefObject } from "react";
import * as XLSX from "xlsx";

export const collectRowErrors = <T>(
  rowId: string,
  row: T,
  schema: ZodSchema<T>,
): Record<string, string> => {
  const errors: Record<string, string> = {};

  const parsed = schema.safeParse(row);

  if (!parsed.success) {
    parsed.error.issues.forEach((issue) => {
      const field = String(issue.path[0]); // avoids symbol errors
      const key = `${rowId}:${field}`;
      errors[key] = issue.message;
    });
  }

  return errors;
};

export const collectAllErrors = <T>(rows: T[], schema: ZodSchema<T>): Record<string, string> =>
  rows.reduce(
    (acc, row) => {
      const id = (row as any).id;
      const rowErrors = collectRowErrors(id, row, schema);
      return { ...acc, ...rowErrors };
    },
    {} as Record<string, string>,
  );

export const validateRow = <TData>(
  rowId: string,
  row: TData,
  errors: TableErrors,
  tableSchema: ZodSchema<TData>,
  setErrors: React.Dispatch<React.SetStateAction<TableErrors>>,
) => {
  const newErrors = { ...errors };

  // Clear old errors for this row
  Object.keys(newErrors).forEach((k) => {
    if (k.startsWith(`${rowId}:`)) delete newErrors[k];
  });

  // Add new validation errors
  const rowErrors = collectRowErrors(rowId, row, tableSchema);
  Object.assign(newErrors, rowErrors);

  setErrors(newErrors);
};

export const validateAll = <TData>(
  rowsToValidate: TData[],
  tableSchema: ZodSchema<TData>,
  setErrors: React.Dispatch<React.SetStateAction<TableErrors>>,
) => {
  const full = collectAllErrors(rowsToValidate, tableSchema);
  setErrors(full);
};

export const getAccessorKey = (col: ColumnDef<any>): string | null => {
  if ("accessorKey" in col && typeof col.accessorKey === "string") {
    return col.accessorKey;
  }
  return null;
};

export const highlightRow = (
  rowId: string,
  rowRefs: RefObject<Record<string, HTMLTableRowElement>>,
  className: string,
) => {
  const el = rowRefs.current[rowId];
  if (!el) return;

  el.classList.add(className);

  // setTimeout(() => {
  //   el.classList.remove(className);
  //   highlightCooldown.delete(rowId);
  // }, 1500);
};

export const removeRowHighlight = (
  rowId: string,
  rowRefs: RefObject<Record<string, HTMLTableRowElement>>,
  className: string,
) => {
  rowRefs.current[rowId].classList.remove(className);
};

export const parseExcel = async (file: File): Promise<any[]> => {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const json = XLSX.utils.sheet_to_json(sheet);

        // Convert Excel rows -> desired format

        resolve(json);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;

    reader.readAsArrayBuffer(file);
  });
};

export function excelSerialToDate(serial: number): Date {
  const EXCEL_EPOCH = new Date(Date.UTC(1899, 11, 30));
  return new Date(EXCEL_EPOCH.getTime() + serial * 86400000);
}

export function normalizeExcelDate(value: any): string {
  // Excel serial number
  if (typeof value === "number") {
    return excelSerialToDate(value).toISOString().split("T")[0];
  }

  // Date string
  const parsed = new Date(value);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  throw new Error("Invalid date format");
}
