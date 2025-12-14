import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "shadcn-lib/dist/components/ui/select";
import { Label } from "shadcn-lib/dist/components/ui/label";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { clsx as cn } from "clsx";

type Option = {
  label: string;
  value: string;
};

interface FormSelectProps<T extends FieldValues> {
  /** Field name (must match your RHF schema key) */
  name: Path<T>;
  /** RHF control object */
  control: Control<T>;
  /** Label shown above the field */
  label?: string;
  /** Placeholder */
  placeholder?: string;
  /** Select options */
  options: Option[];
  /** Required indicator */
  required?: boolean;
  /** Additional classes */
  className?: string;
  /** custom onchange method for parent */
  onChange?: (value: string) => void;
}

/**
 * 🔁 Reusable FormSelect — integrates ShadCN Select + RHF Controller
 */
export const FormSelect = <T extends FieldValues>({
  name,
  control,
  label,
  placeholder = "Select an option",
  options,
  required,
  className,
  onChange,
}: FormSelectProps<T>) => {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <div className={cn("space-y-1 w-full", className)}>
          {label && (
            <Label className='text-sm font-medium'>
              {label}
              {required && <span className='text-red-500 ml-1'>*</span>}
            </Label>
          )}

          <Select
            value={field.value}
            onValueChange={(value: string) => {
              field.onChange(value);
              onChange?.(value);
            }}
          >
            <SelectTrigger
              className={cn(
                "w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                fieldState.error && "border-red-500 focus:ring-red-500",
              )}
            >
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>

            <SelectContent>
              <SelectGroup>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {fieldState.error && (
            <p className='text-xs text-red-500 mt-1'>{fieldState.error.message}</p>
          )}
        </div>
      )}
    />
  );
};
