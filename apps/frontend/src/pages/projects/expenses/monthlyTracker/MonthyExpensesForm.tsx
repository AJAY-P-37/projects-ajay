import { useReducer } from "react";
import { useForm, useFieldArray } from "react-hook-form";

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
import {
  currentMonth,
  currentYear,
  ExpensesFormData,
  expensesSchema,
  months,
  years,
} from "./MonthlyExpensesFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { setCategories, setMonthlyExpensesForm } from "@/store/slices/expensesSlice";
import { usePromise } from "@/hooks/promiseHooks";

// ---------------- COMPONENT ----------------
export const ExpensesForm = ({ expensesFormHook, setExpenseData }) => {
  const { run, ...state } = usePromise();
  const reduxDispatch = useDispatch();

  const { control, handleSubmit, watch } = expensesFormHook;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "statements",
  });

  const selectedTypes = watch("statements")?.map((s) => s.type);

  const { user } = useSelector((state: RootState) => state.auth);

  const onSubmit = async (formData: ExpensesFormData) => {
    const f = async () => {
      let response = { categoriesData: [], processedData: [] };

      const expensesService = new ExpensesService();

      await Promise.all(
        formData.statements.map(async (statement) => {
          try {
            // Upload
            const uploadedFileMeta = await FirebaseService.uploadFilesToFirebase(
              statement.file,
              `expenses/${user?.email}/statements`,
            );

            // Parse statement
            const data = await expensesService.processMonthlyExpenseStatements({
              month: parseInt(formData.month),
              year: parseInt(formData.year),
              statementType: statement.type,
              statementFileMetadata: uploadedFileMeta[0],
            });

            if (!data.processedData || !data.categoriesData) return;
            // Merge processed data
            response.processedData.push(...data.processedData);

            // Categories same for all statements
            if (response.categoriesData.length === 0) {
              response.categoriesData = data.categoriesData;
              reduxDispatch(setCategories(data.categoriesData));
              // reduxDispatch(setMonthlyExpensesForm(formData));
            }
          } catch (err: any) {
            Toast.error(err.message || "Error processing statement(s)");
          }
        }),
      );
      setExpenseData(response);
    };

    run(f);
  };

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
            const availableOptions = statementDocumentOptions.filter(
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
                      onClick={() => remove(index)}
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
                />

                <FormFileUpload
                  control={control}
                  name={`statements.${index}.file`}
                  label='Upload File'
                  allowedFileTypes={["xlsx", "xls", "csv"]}
                  required
                />
              </div>
            );
          })}

          <Button
            type='button'
            variant='outline'
            className='w-full border-dashed'
            onClick={() => append({ type: "", file: undefined as unknown as File })}
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
