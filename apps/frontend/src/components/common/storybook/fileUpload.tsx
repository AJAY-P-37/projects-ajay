"use client";

import * as React from "react";
import { Controller, Control, FieldValues, Path } from "react-hook-form";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { Label } from "shadcn-lib/dist/components/ui/label";
import { ScrollArea } from "shadcn-lib/dist/components/ui/scroll-area";
import { Trash2, Upload } from "lucide-react";
import { clsx as cn } from "clsx";

interface BaseProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  allowedFileTypes?: string[];
  required?: boolean;
  className?: string;
}

interface SingleFileProps<T extends FieldValues> extends BaseProps<T> {
  allowMultiple?: false;
}

interface MultiFileProps<T extends FieldValues> extends BaseProps<T> {
  allowMultiple: true;
}

type FormFileUploadProps<T extends FieldValues> = SingleFileProps<T> | MultiFileProps<T>;

/**
 * 📁 FormFileUpload — Shadcn + RHF ready file uploader
 */
export const FormFileUpload = <T extends FieldValues>({
  name,
  control,
  label,
  allowedFileTypes,
  allowMultiple = false,
  required,
  className,
}: FormFileUploadProps<T>) => {
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => {
        const value = field.value;
        const files: File[] = allowMultiple
          ? (value as File[]) || []
          : value
            ? [value as File]
            : [];

        const [invalidFiles, setInvalidFiles] = React.useState<string[]>([]);

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const selectedFiles = Array.from(e.target.files || []);
          const validFiles: File[] = [];
          const invalidFileNames: string[] = [];

          selectedFiles.forEach((file) => {
            const ext = file.name.split(".").pop()?.toLowerCase();
            if (!allowedFileTypes || (ext && allowedFileTypes.includes(ext))) {
              validFiles.push(file);
            } else {
              invalidFileNames.push(file.name);
            }
          });

          setInvalidFiles(invalidFileNames);

          if (allowMultiple) {
            field.onChange([...(files || []), ...validFiles]);
          } else {
            field.onChange(validFiles[0] || null);
          }

          e.target.value = ""; // reset input
        };

        const handleRemove = (index: number) => {
          if (allowMultiple) {
            const updatedFiles = files.filter((_, i) => i !== index);
            field.onChange(updatedFiles);
          } else {
            field.onChange(null);
          }
        };

        return (
          <div className={cn("space-y-2", className)}>
            {label && (
              <Label className='text-sm font-medium'>
                {label}
                {required && <span className='text-red-500 ml-1'>*</span>}
              </Label>
            )}

            <Button
              type='button'
              variant='outline'
              onClick={() => inputRef.current?.click()}
              className='flex items-center gap-2'
            >
              <Upload className='w-4 h-4' />
              {allowMultiple ? "Upload Files" : "Upload File"}
            </Button>

            <input
              ref={inputRef}
              type='file'
              className='hidden'
              multiple={allowMultiple}
              accept={`.${allowedFileTypes.join(",.")}`}
              onChange={handleChange}
            />

            <ScrollArea className='mt-4 max-h-[100px] overflow-y-auto'>
              {files.length === 0 ? (
                <p className='text-sm text-gray-400 italic px-2 py-1'>No files selected</p>
              ) : (
                files.map((file, index) => (
                  <div
                    key={index}
                    className='grid grid-cols-[1fr_auto] items-center py-1 px-2 border-b border-gray-100'
                  >
                    <span className='text-sm truncate'>{file.name}</span>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => handleRemove(index)}
                      className='text-red-500 hover:text-red-700'
                    >
                      <Trash2 className='w-4 h-4' />
                    </Button>
                  </div>
                ))
              )}
            </ScrollArea>

            {fieldState.error && (
              <p className='text-xs text-red-500 mt-1'>{fieldState.error.message}</p>
            )}
            {invalidFiles.length > 0 && (
              <p className='text-xs text-red-500 mt-2'>
                Invalid file type for: {invalidFiles.join(", ")}.
                <br />
                Allowed types: {allowedFileTypes?.join(", ") || "any"}
              </p>
            )}
          </div>
        );
      }}
    />
  );
};
