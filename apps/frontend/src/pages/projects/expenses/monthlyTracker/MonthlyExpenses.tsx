import { ExpensesForm } from "./MonthyExpensesForm";
import { MultiStepForm } from "@/components/common/storybook/multiStepForm";
import { useState, useMemo, useEffect } from "react";
import { ExpensesTable } from "./ProcessExpenseTable/Table";
import { ProcessExpenseFileResponse } from "common-types/types/expenses";
import { useForm, UseFormReturn } from "react-hook-form";
import {
  currentMonth,
  currentYear,
  ExpensesFormData,
  expensesSchema,
} from "./MonthlyExpensesFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ExpensesVisual } from "./MonthlyExpenseVisuals/Table";

export const Expenses = () => {
  const [currentStep, setCurrentStep] = useState("step1");

  const [canProceedStep, setCanProceedStep] = useState({
    step1: false,
    step2: false,
    step3: false,
  });

  let expenseTable = null;
  const { tables } = useSelector((state: RootState) => state.tables);
  if (tables["expenses-table"]) {
    expenseTable = tables["expenses-table"].data;
  }

  const { categories, formValues } = useSelector((state: RootState) => state.expenses);

  const [expenseData, setExpenseData] = useState<ProcessExpenseFileResponse | null>({
    processedData: expenseTable,
    categoriesData: categories,
  });

  const [monthlyPivotData, setMonthlyPivotData] = useState(null);

  // useEffect(() => {
  //   const s = formValues.statements.map(async (s) => {
  //     let blob;
  //     if (typeof s.file === "string") blob = await fetch(s.file).then((r) => r.blob());
  //     console.log(blob);
  //     return {
  //       ...s,
  //       file: blob,
  //     };
  //   });
  // });

  const expensesFormHook: UseFormReturn<ExpensesFormData> = useForm<ExpensesFormData>({
    resolver: zodResolver(expensesSchema),
    defaultValues: {
      month: formValues.month,
      year: formValues.year,
      statements: formValues.statements,
    },
  });

  const steps = useMemo(() => {
    return [
      {
        id: "step1",
        label: "Process",
        canProceed: canProceedStep.step1,
        component: (
          <ExpensesForm
            setExpenseData={(data) => {
              setCanProceedStep((prev) => ({ ...prev, step1: true }));
              setCurrentStep("step2");
              setExpenseData(data);
            }}
            expensesFormHook={expensesFormHook}
          />
        ),
      },
      {
        id: "step2",
        label: "Review",
        canProceed: canProceedStep.step2,
        component: expenseData.processedData ? (
          <ExpensesTable
            rows={expenseData.processedData}
            categories={expenseData.categoriesData}
            expensesForm={expensesFormHook}
            setExpenseData={(data) => {
              setExpenseData((prev) => ({ ...prev, processedData: data }));
            }}
            setMonthlyPivotData={(data) => {
              setCanProceedStep((prev) => ({ ...prev, step2: true }));
              setCurrentStep("step3");
              setMonthlyPivotData(data);
            }}
          />
        ) : (
          <p className='text-sm text-center text-muted-foreground'>
            Process a file to view results.
          </p>
        ),
      },
      {
        id: "step3",
        label: "Visualize",
        canProceed: canProceedStep.step3,
        component: monthlyPivotData ? (
          <ExpensesVisual
            rows={monthlyPivotData}
            categories={expenseData.categoriesData}
            expensesForm={expensesFormHook}
          />
        ) : (
          <p className='text-sm text-center text-muted-foreground'>
            Process a file and review to Visualize.
          </p>
        ),
      },
    ];
  }, [canProceedStep, expenseData, expensesFormHook]);

  return (
    <MultiStepForm
      title='Monthly Expense Tracker'
      steps={steps}
      showNavButtons
      allowSkip={false}
      currentActiveStepId={currentStep}
      setParentStep={(stepId) => setCurrentStep(stepId)}
      onSubmit={() => alert("Form submitted!")}
    />
  );
};
