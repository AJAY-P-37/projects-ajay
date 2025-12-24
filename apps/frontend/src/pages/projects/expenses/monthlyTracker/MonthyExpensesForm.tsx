import { useFieldArray } from "react-hook-form";

import { Button } from "shadcn-lib/dist/components/ui/button";
import { Card } from "shadcn-lib/dist/components/ui/card";
import { FormFileUpload } from "@/components/common/storybook/fileUpload";
import { FormSelect } from "@/components/common/storybook/select";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { statementDocumentOptions } from "common-types/types/expenses";
import { Toast } from "shadcn-lib/dist/components/ui/sonner";
import { LoaderCircle, CloudUpload } from "lucide-react";
import { ExpensesFormData, months, years } from "./MonthlyExpensesFormSchema";
import { setCategories } from "@/store/slices/expensesSlice";
import { useState } from "react";
import { useProcessExpenseStatements } from "./useProcessExpenseStatements";
import { AuthError } from "@/services/Service";
import { useLogout } from "@/hooks/authHooks";

// ---------------- COMPONENT ----------------
export const ExpensesForm = ({ expensesFormHook, setExpenseData }) => {
  const { control, handleSubmit, watch } = expensesFormHook;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "statements",
  });

  const supportedStatements = statementDocumentOptions.filter((statement) => statement.supported);
  const [selectedTypes, setSelectTypes] = useState(watch("statements")?.map((s) => s.type));

  const { user } = useSelector((state: RootState) => state.auth);

  const { mutateAsync, isSuccess, isError, isPending } = useProcessExpenseStatements();
  const logout = useLogout();

  const onSubmit = async (formData: ExpensesFormData) => {
    try {
      const { consolidatedData } = await mutateAsync({
        month: Number(formData.month),
        year: Number(formData.year),
        userEmail: user!.email,
        statements: formData.statements,
      });

      setExpenseData({ processedData: consolidatedData });
    } catch (error: any) {
      if (error instanceof AuthError) {
        Toast.error("Session expired. Please log in again.");
        logout();
      }
    }
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
        <Button type='submit' className='w-full mt-4' disabled={isPending}>
          {isPending ? <LoaderCircle className='animate-spin' /> : <CloudUpload />}Submit
        </Button>

        {/* Feedback */}
        {isSuccess && <p className='text-green-600 text-sm text-center'>Submitted successfully!</p>}
        {isError && <p className='text-red-500 text-sm text-center'>Something went wrong!</p>}
      </form>
    </Card>
  );
};
