import { ColumnDef } from "@tanstack/react-table";
import { ZodSchema } from "zod";
import { TableErrors } from "./DataTable";
import { RefObject } from "react";

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
