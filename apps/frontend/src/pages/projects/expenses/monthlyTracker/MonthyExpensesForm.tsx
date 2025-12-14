import { useFieldArray } from "react-hook-form";

import { Button } from "shadcn-lib/dist/components/ui/button";
import { Card } from "shadcn-lib/dist/components/ui/card";
import { FormFileUpload } from "@/components/common/storybook/fileUpload";
import { FormSelect } from "@/components/common/storybook/select";
import { FirebaseService } from "@/services/FirebaseService";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store/store";
import ExpensesService from "@/services/ExpensesService";
import { statementDocumentOptions } from "common-types/types/expenses";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { LoaderCircle, CloudUpload } from "lucide-react";
import { ExpensesFormData, months, years } from "./MonthlyExpensesFormSchema";
import { setCategories } from "@/store/slices/expensesSlice";
import { usePromise } from "@/hooks/promiseHooks";
import { useState } from "react";

// ---------------- COMPONENT ----------------
export const ExpensesForm = ({ expensesFormHook, setExpenseData }) => {
  const { run, ...state } = usePromise();
  const reduxDispatch = useDispatch();

  const { control, handleSubmit, watch } = expensesFormHook;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "statements",
  });

  const supportedStatements = statementDocumentOptions.slice(0, 3);
  const [selectedTypes, setSelectTypes] = useState(watch("statements")?.map((s) => s.type));

  const { user } = useSelector((state: RootState) => state.auth);

  const onSubmit = async (formData: ExpensesFormData) => {
    const f = async () => {
      let response = { processedData: [] };

      const expensesService = new ExpensesService();
      await Promise.all(
        formData.statements.map(async (statement) => {
          let uploadedFileMeta;
          try {
            // Upload
            uploadedFileMeta = await FirebaseService.uploadFilesToFirebase(
              statement.file,
              `expenses/${user?.email}/statements`,
              // `${statement.type} card statement`,
            );

            // Parse statement
            const data = await expensesService.processMonthlyExpenseStatements({
              month: parseInt(formData.month),
              year: parseInt(formData.year),
              statementType: statement.type,
              statementFilesMetadata: uploadedFileMeta,
            });

            if (!data.processedData) return;
            // Merge processed data
            response.processedData.push(...data.processedData);
          } catch (err: any) {
            Toast.error(err.message || "Error processing statement(s)");
          } finally {
            if (uploadedFileMeta) {
              await Promise.all(
                uploadedFileMeta.map(async (file) => {
                  await FirebaseService.deleteFileFromStorage(file.fullPath);
                }),
              );
            }
          }
        }),
      );
      setExpenseData(response);
    };

    run(f);
  };
  console.log(selectedTypes);

  return (
    <Card className='p-6 max-w-lg mx-auto space-y-6 rounded-2xl shadow-md bg-card'>
      <h2 className='text-xl text-center font-semibold mb-2'>Upload Expense Statements</h2>

      <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
        {/* Month Selector */}
        <FormSelect name='month' options={months} control={control} label='Select month' required />
        {/* Year Selector */}
        <FormSelect name='year' options={years} control={control} label='Select year' required />

        {/* Dynamic Statement Uploads */}
        <div className='space-y-4'>
          {fields.map((field, index) => {
            const availableOptions = supportedStatements.filter(
              (opt) =>
                !selectedTypes.includes(opt.value) ||
                opt.value === watch(`statements.${index}.type`),
            );
            return (
              <div
                key={field.id}
                className='border border-gray-300 rounded-xl p-4 space-y-3 relative'
              >
                <div className='flex justify-between items-center'>
                  <h4 className='font-medium text-sm'>Statement {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type='button'
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        remove(index);
                        setSelectTypes((prev: string[]) =>
                          prev.filter((x) => x !== selectedTypes[index]),
                        );
                      }}
                      className='text-red-500'
                    >
                      ✕
                    </Button>
                  )}
                </div>

                <FormSelect
                  name={`statements.${index}.type`}
                  options={availableOptions}
                  control={control}
                  label='Statement Type'
                  required
                  onChange={(value: string) =>
                    setSelectTypes((prev) => {
                      const x = [...prev];
                      x[index] = value;
                      return x;
                    })
                  }
                />

                <FormFileUpload
                  control={control}
                  name={`statements.${index}.file`}
                  label='Upload File(s)'
                  allowedFileTypes={["xlsx", "xls"]}
                  allowMultiple={true}
                  required
                />
              </div>
            );
          })}

          <Button
            type='button'
            variant='outline'
            className='w-full border-dashed'
            onClick={() => append({ type: "", file: [] })}
            disabled={fields.length >= supportedStatements.length}
          >
            + Add another statement
          </Button>
        </div>

        {/* Submit Button */}
        <Button type='submit' className='w-full mt-4' disabled={state.loading}>
          {state.loading ? <LoaderCircle className='animate-spin' /> : <CloudUpload />}Submit
        </Button>

        {/* Feedback */}
        {state.success && (
          <p className='text-green-600 text-sm text-center'>Submitted successfully!</p>
        )}
        {state.error && <p className='text-red-500 text-sm text-center'>{state.error}</p>}
      </form>
    </Card>
  );
};
