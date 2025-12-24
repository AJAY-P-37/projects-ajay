import { ExpensesForm } from "./MonthyExpensesForm";
import { MultiStepForm } from "@/components/common/storybook/multiStepForm";
import { useState, useMemo } from "react";
import { ExpensesTable } from "./ProcessExpenseTable/Table";
import { IExpensesCategory } from "common-types/types/expenses";
import { useForm, UseFormReturn } from "react-hook-form";
import { ExpensesFormData, expensesSchema } from "./MonthlyExpensesFormSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";
import { ExpensesVisual } from "./MonthlyExpenseVisuals/Table";
import ExpensesService from "@/services/ExpensesService";
import { useQuery } from "@tanstack/react-query";
import { Loader } from "@/components/common/storybook/loader";

export const MonthlyExpenses = () => {
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

  const { formValues } = useSelector((state: RootState) => state.expenses);

  const {
    data: categories,
    isLoading: isCategoriesLoading,
  }: { data: IExpensesCategory[]; isLoading: boolean } = useQuery({
    queryKey: ["categories"],
    queryFn: () => new ExpensesService().getCategories(),
    refetchOnWindowFocus: false,
    retry: false,
  });

  const [expenseData, setExpenseData] = useState({
    processedData: expenseTable,
  });

  const [monthlyPivotData, setMonthlyPivotData] = useState(null);

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
            categories={categories.map((c) => c.category)}
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
            categories={categories.map((c) => c.category)}
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

  return isCategoriesLoading ? (
    <Loader />
  ) : (
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
