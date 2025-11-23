import { clsx as cn } from "clsx";
import { Input } from "shadcn-lib/dist/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "shadcn-lib/dist/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "shadcn-lib/dist/components/ui/popover";
import { Calendar } from "shadcn-lib/dist/components/ui/calendar";
import { ErrorPopover } from "./ErrorPopover";
import { TriangleAlert } from "lucide-react";
// import { useState } from "react";

type UIType = "input" | "number" | "select" | "date" | "text";

interface EditableCellProps {
  row: any;
  table: any;
  accessor: string;
  width?: string;
  ui: UIType;

  // only needed for selects
  options?: { label: string; value: string }[] | string[];

  // for formatting view mode
  renderView?: (value: any) => React.ReactNode;
}

export const EditableCell = ({
  row,
  table,
  accessor,
  ui,
  options = [],
  width = "w-full",
  renderView,
}: EditableCellProps) => {
  const r = row.original;

  const error = table.options.meta.errors?.[`${r.id}:${accessor}`];
  //focus-visible:ring-destructive bg-destructive/10
  const errorClassName = "text-destructive-foreground";

  // Value: uses draft if editing
  const value = r._editing ? r._draft?.[accessor] : r[accessor];
  r._editing && console.log(value);

  const update = (val: any) => {
    table.options.meta.updateCell(r.id, accessor as any, val);
  };

  let Cell = null;

  if (!r._editing) {
    Cell = (
      <div
        className={cn(
          "flex items-center justify-center px-2 py-1 rounded w-full h-full ",
          width,
          error && "border border-input",
        )}
      >
        {value === "" ? "\u00A0 " : renderView ? renderView(value) : value}
      </div>
    );
  } else {
    // Editing mode
    Cell = getCellType(ui, value, width, update, error, errorClassName, options);
  }

  // const [hover, setHover] = useState(false);

  return (
    <div
      className='relative w-full'
      // onMouseEnter={() => setHover(true)}
      // onMouseLeave={() => setHover(false)}
    >
      {Cell}
      {error && (
        <ErrorPopover error={error}>
          <div className='absolute -right-2 -top-2 cursor-pointer'>
            <TriangleAlert className={`text-destructive w-4 h-4`} />
          </div>
        </ErrorPopover>
      )}
    </div>
  );
};

export const getCellType = (
  ui: string,
  value: any,
  width: string,
  update: any,
  error: any,
  errorClassName: string,
  options: { label: string; value: string }[] | string[],
  placeholder?: string,
) => {
  console.log(ui, value);
  switch (ui) {
    case "input":
      return (
        <Input
          placeholder={placeholder}
          value={value ?? ""}
          onChange={(e) => update(e.target.value)}
          className={cn(width, error && errorClassName)}
        />
      );

    case "number":
      return (
        <Input
          placeholder={placeholder}
          type='number'
          value={value}
          onChange={(e) => update(Number(e.target.value))}
          className={cn(width, error && errorClassName)}
        />
      );

    case "select":
      return (
        <Select key={value} value={value} onValueChange={(v) => update(v)}>
          <SelectTrigger className={cn("w-full", width, error && errorClassName)}>
            <SelectValue placeholder={placeholder || "Select"} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o: any) =>
              typeof o === "string" ? (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ) : (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ),
            )}
          </SelectContent>
        </Select>
      );

    case "date": {
      const dateObj = value ? new Date(value) : null;
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      return (
        <Popover>
          <PopoverTrigger className='h-9' asChild>
            <button
              className={cn(
                "border border-input px-2 py-1 rounded text-left w-full",
                width,
                error && errorClassName,
              )}
            >
              {dateObj ? (
                dateObj.toLocaleDateString("en-GB")
              ) : (
                <span className='text-muted-foreground'>{placeholder || "Select date"}</span>
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0'>
            <Calendar
              mode='single'
              selected={dateObj || undefined}
              onSelect={(v) => v && update(formatDate(v))}
              className='rounded'
            />
          </PopoverContent>
        </Popover>
      );
    }

    case "text":
      return (
        <textarea
          placeholder={placeholder}
          value={value || ""}
          onChange={(e) => update(e.target.value)}
          className={cn("border rounded p-2", width, error && errorClassName)}
        />
      );

    default:
      return <span>Invalid UI type</span>;
  }
};
