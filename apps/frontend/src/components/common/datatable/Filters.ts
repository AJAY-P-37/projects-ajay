import { FilterFn } from "@tanstack/react-table";

export const numberFilter: FilterFn<any> = (row, columnId, filterValue) => {
  const rowValue = row.getValue(columnId);
  if (filterValue === undefined || filterValue === null || filterValue === "") return true;

  return String(rowValue).includes(String(filterValue));
};

export const numberFilter1: FilterFn<any> = (row, columnId, filterValue) => {
  const value = row.getValue<number>(columnId);
  if (filterValue == null || filterValue === "") return true;
  return value === Number(filterValue);
};
