import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  SortingState,
  getSortedRowModel,
  ColumnFiltersState,
  getFilteredRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "shadcn-lib/dist/components/ui/table";
import { RowData } from "@tanstack/react-table";
import { ZodSchema } from "zod";
import { ResizeHandle, useColumnResize } from "./Resize";
import { ActionsColumn, TableActions, TableActionsFooter } from "./Actions";
import {
  collectAllErrors,
  getAccessorKey,
  highlightRow,
  removeRowHighlight,
  validateRow,
} from "./TableUtils";
import { Card, CardContent } from "shadcn-lib/dist/components/ui/card";
import { Input } from "shadcn-lib/dist/components/ui/input";
import { numberFilter } from "./Filters";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    updateCell: (rowId: string, key: keyof TData, value: any) => void;
    errors: any;
  }
  interface ColumnMeta<TData, TValue> {
    width?: number;
  }
}

export interface BaseRow<TData> {
  id: string;
  _editing?: boolean;
  _draft: TData;
}

export interface DataTableProps<TData extends BaseRow<TData>, TValue> {
  name: string;
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  tableSchema: ZodSchema<TData>;
  createEmptyRow?: () => TData;
  actions?: TableActions<TData>;
}
export type ErrorKey = `${string}:${string}`;
export type TableErrors = Record<ErrorKey, string>;

export function DataTable<TData extends BaseRow<TData>, TValue>({
  name,
  columns,
  data,
  tableSchema,
  createEmptyRow,
  actions = {
    addRow: false,
    editRow: false,
    deleteRow: false,
    copyTableToClipboard: false,
    temporarySave: false,
    saveTable: null,
  },
}: DataTableProps<TData, TValue>) {
  const [rows, setRows] = React.useState<TData[]>(
    data.map((r) => ({
      ...r,
      id: crypto.randomUUID(),
      _editing: false,
      _draft: { ...r }, // clone original row for edit mode
    })),
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);

  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  const [errors, setErrors] = React.useState<TableErrors>({});

  const { columnWidths, indicatorX, startResize } = useColumnResize(columns);

  const bottomRef = React.useRef<any>(null);

  // Validate entire table on mount
  React.useEffect(() => {
    const allErrors = collectAllErrors(rows, tableSchema);
    setErrors(allErrors);
  }, []);

  const updateCell = <K extends keyof TData>(rowId: string, field: K, value: TData[K]) => {
    const newRows = rows.map((r) => {
      if (r.id !== rowId) return r;

      if (!r._editing) {
        return { ...r, [field]: value };
      }

      return {
        ...r,
        _draft: { ...(r._draft || {}), [field]: value },
      };
    });

    setRows(newRows);

    const updated = newRows.find((r) => r.id === rowId)!;
    const freshRow = updated._editing ? updated._draft : updated;
    validateRow(rowId, freshRow, errors, tableSchema, setErrors);
  };

  const table = useReactTable<TData>({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
    meta: {
      updateCell,
      errors,
    },
    filterFns: {
      numberFilter: numberFilter,
    },
  });

  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  const handleStartEdit = (id: string) => {
    actions.editRow &&
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, _editing: true } : r)));
  };

  return (
    <div className='px-0 flex flex-col border border-secondary-foreground rounded'>
      <TableActions
        name={name}
        columns={columns}
        rows={rows}
        setRows={setRows}
        tableSchema={tableSchema}
        actions={actions}
        setErrors={setErrors}
        createEmptyRow={createEmptyRow}
        bottomRef={bottomRef}
        rowRefs={rowRefs}
      />
      <div className='w-full overflow-x-auto scrollbar-thin rounded h-[500px]'>
        <Table noWrapper className='min-w-max border-separate border-spacing-0'>
          <TableHeader className='sticky z-10 top-0 bg-muted'>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    style={{
                      position: "relative",
                      width: columnWidths[getAccessorKey(header.column.columnDef)],
                      transition: "width 150ms ease", // smooth animation
                    }}
                    className='text-card-foreground text-center px-0'
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <ResizeHandle
                      onMouseDown={(e) => startResize(header.column.columnDef, e.clientX)}
                    />
                  </TableHead>
                ))}
                {(actions.editRow || actions.deleteRow) && (
                  <TableHead className='w-32 text-center text-card-foreground'>Actions</TableHead>
                )}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const original = row.original;
                return (
                  <TableRow
                    key={original.id}
                    ref={(el) => {
                      rowRefs.current[original.id] = el;
                    }}
                    onTouchStart={() => highlightRow(original.id, rowRefs, "bg-secondary")}
                    onMouseEnter={() => highlightRow(original.id, rowRefs, "bg-secondary")}
                    onTouchEnd={() => removeRowHighlight(original.id, rowRefs, "bg-secondary")}
                    onMouseLeave={() => removeRowHighlight(original.id, rowRefs, "bg-secondary")}
                    onDoubleClick={() => handleStartEdit(original.id)}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const width = cell.column.columnDef.meta?.width;
                      return (
                        <TableCell key={cell.id} style={{ width }} className='justify-center'>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                    {(actions.editRow || actions.deleteRow) && (
                      <ActionsColumn
                        original={original}
                        actions={actions}
                        tableSchema={tableSchema}
                        errors={errors}
                        setErrors={setErrors}
                        setRows={setRows}
                      />
                    )}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length + (actions.editRow || actions.deleteRow ? 1 : 0)}
                  className='h-24 text-center'
                >
                  No records.
                </TableCell>
              </TableRow>
            )}
            <TableRow ref={bottomRef} />
          </TableBody>
        </Table>
        {/* {indicatorX !== null && <ResizeIndicator x={indicatorX} />} */}
      </div>
      <TableActionsFooter
        name={name}
        columns={columns}
        rows={rows}
        setRows={setRows}
        tableSchema={tableSchema}
        actions={actions}
        setErrors={setErrors}
        createEmptyRow={createEmptyRow}
        bottomRef={bottomRef}
        rowRefs={rowRefs}
      />
    </div>
  );
}
