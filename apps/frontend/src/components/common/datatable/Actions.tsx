import React, { JSX, RefObject, useRef, useState } from "react";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { TableCell } from "shadcn-lib/dist/components/ui/table";
import {
  Check,
  CircleX,
  CopyIcon,
  EditIcon,
  LoaderCircle,
  PlusCircleIcon,
  SaveIcon,
  StoreIcon,
  TrashIcon,
  Upload,
} from "lucide-react";
import { BaseRow, TableErrors } from "./DataTable";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import {
  collectAllErrors,
  getAccessorKey,
  parseExcel,
  validateAll,
  validateRow,
} from "./TableUtils";
import { ZodSchema } from "zod";
import { ColumnDef } from "@tanstack/react-table";
import { useDispatch } from "react-redux";
import { setTable } from "@/store/slices/tableSlice";
import { usePromise } from "@/hooks/promiseHooks";
import { Popover } from "./Popover";
import { Card } from "shadcn-lib/dist/components/ui/card";

const size = "sm";
const variant = "default";

export interface TableActions<TData> {
  addRow?: boolean;
  editRow?: boolean;
  deleteRow?: boolean;
  copyTableToClipboard?: boolean;
  temporarySave?: boolean;
  importRows?: (data: TData[]) => TData[];
  saveTable?: (data: TData[]) => Promise<any>;
}
interface ActionsColumnProps<TData extends BaseRow<TData>> {
  original: TData;
  actions: TableActions<TData>;
  tableSchema: ZodSchema<TData>;
  setRows: React.Dispatch<React.SetStateAction<TData[]>>;
  errors: TableErrors;
  setErrors: React.Dispatch<React.SetStateAction<TableErrors>>;
}
export const ActionsColumn = <TData extends BaseRow<TData>>({
  original,
  actions,
  tableSchema,
  setRows,
  errors,
  setErrors,
}: ActionsColumnProps<TData>): React.JSX.Element => {
  const handleDelete = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleStartEdit = (id: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, _editing: true } : r)));
  };

  const handleSaveRow = (rowId: string) => {
    setRows((prev) => {
      const newRows = prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r._draft, // commit draft to real row
          id: r.id,
          _editing: false,
          _draft: { ...r._draft },
        };
      });

      // validate whole table OR just the saved row
      const savedRow = newRows.find((r) => r.id === rowId)!;
      validateRow(rowId, savedRow, errors, tableSchema, setErrors);

      return newRows;
    });
  };

  const handleCancel = (rowId: string) => {
    setRows((prev) => {
      const newRows = prev.map((r) => {
        if (r.id !== rowId) return r;

        return {
          ...r,
          _editing: false,
          _draft: { ...r },
        };
      });

      // after cancel, revert validation to original
      const original = newRows.find((r) => r.id === rowId)!;
      validateRow(rowId, original, errors, tableSchema, setErrors);

      return newRows;
    });
  };

  return actions.editRow || actions.deleteRow ? (
    <TableCell key={original.id}>
      <div className='flex gap-2 justify-center'>
        {!original._editing ? (
          <>
            {actions.editRow && (
              <Button size={size} variant={variant} onClick={() => handleStartEdit(original.id)}>
                <EditIcon />
              </Button>
            )}
            {actions.deleteRow && (
              <Button size={size} variant={variant} onClick={() => handleDelete(original.id)}>
                <TrashIcon />
              </Button>
            )}
          </>
        ) : (
          actions.editRow && (
            <>
              <Button size={size} variant={variant} onClick={() => handleSaveRow(original.id)}>
                <SaveIcon />
              </Button>
              <Button size={size} variant={variant} onClick={() => handleCancel(original.id)}>
                <CircleX />
              </Button>
            </>
          )
        )}
      </div>
    </TableCell>
  ) : null;
};

interface TableActionsProps<TData extends BaseRow<TData>, TValue> {
  name: string;
  columns: ColumnDef<TData, TValue>[];
  rows: TData[];
  setRows: React.Dispatch<React.SetStateAction<TData[]>>;
  tableSchema: ZodSchema<TData>;
  actions: TableActions<TData>;
  setErrors: React.Dispatch<React.SetStateAction<TableErrors>>;
  createEmptyRow: () => TData;
  bottomRef: RefObject<HTMLDivElement>;
  rowRefs: RefObject<Record<string, HTMLTableRowElement | null>>;
}
export const TableActions = <TData extends BaseRow<TData>, TValue>({
  name,
  columns,
  rows,
  setRows,
  tableSchema,
  actions,
  setErrors,
  createEmptyRow,
  bottomRef,
  rowRefs,
}: TableActionsProps<TData, TValue>) => {
  const dispatch = useDispatch();
  const { run, ...state } = usePromise();
  const saveState = { ...state };

  const inputRef = useRef(null);

  enum ECopy {
    copy = "copy",
    copied = "copied",
  }
  const [copyState, setCopyState] = useState<ECopy>(ECopy.copy);

  const handleAddRow = () => {
    const newRow = createEmptyRow();
    const next = [...rows, { ...newRow, _draft: { ...newRow }, _editing: true }];

    setRows(next);
    // validate all rows including new one
    validateAll(next, tableSchema, setErrors);

    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 40);
    window.scrollBy({ left: -1500, behavior: "smooth" });
  };

  const handleSaveTable = () => {
    const scrollToRow = (rowId: string) => {
      const el = rowRefs.current[rowId];

      if (el) {
        el.scrollIntoView({
          inline: "start",
          behavior: "smooth",
          block: "center",
        });
        el.classList.add("bg-red-500");

        setTimeout(() => el.classList.remove("bg-red-500"), 1500);
        window.scrollBy({ left: -1500, behavior: "smooth" });
      }
    };
    //  Check if any rows are being edited
    const ifAnyRowInEditMode = rows.some((row) => {
      if (row._editing) {
        scrollToRow(row.id);
        Toast.warning("Please save the row or cancel the changes to proceed");
        return true;
      }
    });
    if (ifAnyRowInEditMode) return;

    // Validate all rows
    const allErrors = collectAllErrors(rows, tableSchema);
    setErrors(allErrors);
    //  Check if any errors exist
    const errorKeys = Object.keys(allErrors);

    if (errorKeys.length > 0) {
      const firstKey = errorKeys[0];

      const rowId = firstKey.split(":")[0];

      scrollToRow(rowId);
      Toast.warning("Please fix the errors in red to proceed");

      return; // Stop saving
    }

    // No errors: proceed
    const f = async () => {
      await actions.saveTable(rows);
    };
    run(f);
  };

  const handleStore = () => {
    dispatch(setTable({ id: name, name, data: rows }));
  };

  const handleCopyToClipBoard = (e) => {
    e.preventDefault();
    const copyText = [columns.map((column) => getAccessorKey(column)).join("\t")];
    copyText.push(
      ...rows.map((row) => {
        return columns
          .map((column) => {
            return row[getAccessorKey(column)];
          })
          .join("\t");
      }),
    );
    const text = copyText.join("\n");
    navigator.clipboard.writeText(text);
    Toast.success("Copied Table to clipboard. Try pasting it in a spreadsheet");
    setCopyState(ECopy.copied);
    setTimeout(() => {
      setCopyState(ECopy.copy);
    }, 2000);
  };

  const importRows = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0];
    const data = await parseExcel(file);
    const importRows = actions.importRows(data); // Imported rows transformation methods
    setRows(importRows);
    validateAll(importRows, tableSchema, setErrors);
  };

  return actions.addRow ||
    actions.copyTableToClipboard ||
    actions.temporarySave ||
    actions.saveTable ? (
    <div className='flex justify-between m-3'>
      <div className='flex gap-2'>
        {actions.addRow && (
          <Button onClick={handleAddRow} size={size} variant={variant}>
            <PlusCircleIcon />
            Add Row
          </Button>
        )}
        {actions.importRows && (
          <Popover
            content={
              <div className='space-y-3'>
                <p>
                  Import <strong>xlsx/csv</strong> file with the below columns.
                </p>
                <ul className='space-y-1 list-disc list-inside'>
                  {columns.map((column, index) => (
                    <li className=''>
                      <i>{getAccessorKey(column)}</i>
                    </li>
                  ))}
                </ul>
                <p>
                  Try clicking <strong>Copy icon</strong> to copy the data with columns and edit.
                </p>
              </div>
            }
          >
            <Button
              type='button'
              size={size}
              variant={variant}
              onClick={() => inputRef.current?.click()}
              className='flex items-center gap-2'
            >
              <Upload className='w-4 h-4' />
              Import
              <input
                ref={inputRef}
                type='file'
                className='hidden'
                accept={`.${["xlsx", "csv"].join(",.")}`}
                onChange={importRows}
              />
            </Button>
          </Popover>
        )}
        {actions.copyTableToClipboard &&
          (copyState === ECopy.copy ? (
            <Button onClick={handleCopyToClipBoard} size={size} variant={variant}>
              <CopyIcon /> Copy
            </Button>
          ) : (
            <Button size={size} variant={variant}>
              <Check />
            </Button>
          ))}
      </div>
      <div className='flex gap-2'>
        {actions.temporarySave && (
          <Button onClick={handleStore} size={size} variant={variant}>
            <StoreIcon />
            Store
          </Button>
        )}
        {actions.saveTable && (
          <Button
            onClick={handleSaveTable}
            size={size}
            variant={variant}
            disabled={saveState.loading}
          >
            {saveState.loading ? <LoaderCircle className='animate-spin' /> : <SaveIcon />}Save
          </Button>
        )}
      </div>
    </div>
  ) : null;
};
