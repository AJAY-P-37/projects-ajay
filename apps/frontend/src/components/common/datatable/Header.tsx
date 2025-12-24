import { Column, Table, Header } from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  CircleX,
  ClosedCaptionIcon,
  EyeOff,
} from "lucide-react";

import { clsx as cn } from "clsx";
import { Button } from "shadcn-lib/dist/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "shadcn-lib/dist/components/ui/dropdown-menu";
import { Input } from "shadcn-lib/dist/components/ui/input";
import { getAccessorKey } from "./TableUtils";
import { getCellType, UIType } from "./EditableCell";
import { Popover } from "./Popover";

interface DataTableColumnHeaderProps<TData, TValue> extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  header: Header<TData, TValue>;
  table: Table<TData>;
  title: string;
  ui: UIType;
  options?: { label: string; value: string }[] | string[];
  filter?: boolean;
  sort?: boolean;
}
export function DataTableColumnHeader<TData, TValue>({
  column,
  header,
  table,
  title,
  className,
  ui,
  options = [],
  filter = false,
  sort = false,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return (
      <div className={cn("font-medium text-sm text-muted-foreground", className)}>{title}</div>
    );
  }

  const value = table.getColumn(getAccessorKey(header.column.columnDef))?.getFilterValue();
  const update = (value: any) =>
    table.getColumn(getAccessorKey(header.column.columnDef))?.setFilterValue(value);

  return (
    <div className='flex flex-col w-full pl-1 pr-2 py-2'>
      {/* Filter UI */}
      {filter && (
        <>
          <div className='items-center mb-4'>
            {ui ? (
              getCellType(ui, value, null, update, null, "", options, "Filter...")
            ) : (
              <Input
                placeholder={`Filter ${title}...`}
                value={(value as string) ?? ""}
                onChange={(event) => update(event.target.value)}
                className='h-8 text-sm border rounded-md focus-visible:ring-1'
              />
            )}
          </div>
          <Popover>
            <div className='absolute right-1 top-1 cursor-pointer'>
              <CircleX
                className='text-destructive-foreground hover:text-destructive bg-secondary w-4 h-4'
                onClick={(e) => {
                  update(undefined);
                }}
              />
            </div>
          </Popover>
        </>
      )}

      {/* Column Header */}
      <div
        className={cn(
          "flex items-center justify-center w-full pt-2",
          filter && "border-t",
          className,
        )}
      >
        {sort ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='ghost'
                size='sm'
                className='flex items-center gap-2 h-8 px-2 text-sm rounded-md'
              >
                <span className='font-medium'>{title}</span>
                {column.getIsSorted() === "desc" ? (
                  <ArrowDown className='h-4 w-4' />
                ) : column.getIsSorted() === "asc" ? (
                  <ArrowUp className='h-4 w-4' />
                ) : (
                  <ChevronsUpDown className='h-4 w-4 opacity-50' />
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align='start' className='w-32 text-sm'>
              <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
                <ArrowUp className='h-4 w-4 mr-2' /> Asc
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
                <ArrowDown className='h-4 w-4 mr-2' /> Desc
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => column.toggleVisibility(false)}>
                <EyeOff className='h-4 w-4 mr-2' /> Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <span className='font-medium'>{title}</span>
        )}
      </div>
    </div>
  );
}
