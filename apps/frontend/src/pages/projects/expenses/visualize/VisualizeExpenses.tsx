import { useQuery } from "@tanstack/react-query";
import ExpensesService from "@/services/ExpensesService";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
} from "shadcn-lib/dist/components/ui/card";

import { ChartConfig } from "shadcn-lib/dist/components/ui/chart";

import { useIsMobile } from "shadcn-lib/dist/hooks/use-mobile";
import { Loader2 } from "lucide-react";
import { YearlyTotalTrendAreaChart } from "./Charts/YearlyTotalTrendAreaChart";
import { YearlyCategoryStackedBarChart } from "./Charts/YearlyCategoryStackedBarChart";
import { MonthlyBreakdownBarChart } from "./Charts/MonthlyBreakdownBarChart";
import { FormSelect } from "@/components/common/storybook/select";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  currentMonth,
  currentMonthName,
  currentYear,
  months,
  years,
} from "../monthlyTracker/MonthlyExpensesFormSchema";
import { MonthlyBreakdownPieChart } from "./Charts/MonthlyBreakdownPieChart";
import { is } from "zod/v4/locales";
import { YearlyBreakdownBarChart } from "./Charts/YearlyBreakdownBarChart";
import { useMemo } from "react";

export interface IExpensesVisualConfig {
  year: string;
  month: string;
  category: string;
}

export const ExpensesVisualSchema = z.object({
  month: z.string().min(1, "Please select a month"),
  year: z.string().min(1, "Please select a year"),
  category: z.string().min(1, "Please select a category"),
});

// utils/categoryColors.ts
function generateCategoryColors(categories: string[]) {
  const colors: Record<string, string> = {};

  const GOLDEN_ANGLE = 137.508; // visually optimal separation

  categories?.forEach((cat, index) => {
    const hue = (index * GOLDEN_ANGLE) % 360;

    // Alternate saturation/lightness for better contrast
    const saturation = index % 2 === 0 ? 65 : 75;
    const lightness = index % 3 === 0 ? 50 : 58;

    colors[cat] = `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
  });

  return colors;
}

export const VisualizeExpenses = () => {
  const isMobile = useIsMobile();

  const expensesVisualHook: UseFormReturn<IExpensesVisualConfig> = useForm<IExpensesVisualConfig>({
    resolver: zodResolver(ExpensesVisualSchema),
    defaultValues: {
      year: currentYear,
      month: currentMonthName,
      category: "Total",
    },
  });

  const { control, watch } = expensesVisualHook;

  const { month: selectedMonth, year: selectedYear, category: selectedCategory } = watch();

  const { data, isLoading } = useQuery({
    queryKey: ["monthly-consolidated", selectedYear],
    queryFn: () => new ExpensesService().getMonthlyConsolidatedPivotTable(Number(selectedYear)),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !data?.categories) {
    return (
      <div className='flex justify-center py-24'>
        <Loader2 className='h-8 w-8 animate-spin text-card-foreground' />
      </div>
    );
  }

  const { categories, months: monthsAvailable } = data;

  const chartConfig: ChartConfig = {
    amount: {
      label: "Amount",
    },
    Total: {
      label: "Total",
      color: "var(--chart-1)",
    },
  };

  const categoryColors = generateCategoryColors(categories);

  categories?.forEach((cat) => {
    chartConfig[cat] = {
      label: cat,
      color: categoryColors[cat],
    };
  });

  /* ----------------------------
     YEARLY DATA (Trend + Bars)
  ----------------------------- */
  let isYearlyDataPresent = monthsAvailable.some((m) => {
    return m.data.some((d) => d.category === "Total" && d.amount > 0);
  });

  const yearlyData = monthsAvailable.map((m) => {
    const total = m.data.find((d) => d.category === "Total")?.amount || 0;

    return {
      month: m.month,
      Total: total,
      ...Object.fromEntries(
        m.data.filter((d) => d.category !== "Total").map((d) => [d.category, d.amount]),
      ),
      TotalExcludingInvestment:
        total - (m.data.find((d) => d.category === "Investment")?.amount || 0),
    };
  });

  /* ----------------------------
     SELECTED MONTH DETAILS
  ----------------------------- */
  const monthDetail = monthsAvailable.find((m) => m.month === selectedMonth);

  const chartData = monthDetail.data.filter((d) => d.category !== "Total" && d.amount > 0);

  /* ----------------------------
     SELECTED Category DETAILS
  ----------------------------- */
  const categoryTotals: Record<string, number> = { Total: 0 };

  yearlyData.forEach((row) => {
    categoryTotals.Total += row.Total || 0;
    categories.forEach((cat) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (row[cat] || 0);
    });
  });

  return (
    <Card className='@container/card border-0'>
      <CardHeader>
        <CardTitle>Expense Overview – {selectedYear}</CardTitle>
        <CardDescription>Monthly trend & category-wise breakdown</CardDescription>

        <CardAction>
          <form className='flex-row justify-center items-center gap-4 flex'>
            <FormSelect
              name='category'
              options={[
                { label: "Total", value: "Total" },
                ...categories.map((key) => ({ label: key, value: key })),
              ]}
              control={control}
              label=''
            />

            <FormSelect name='year' options={years} control={control} label='' />

            <FormSelect
              name='month'
              options={months.map((m) => ({ ...m, value: m.label }))}
              control={control}
              label=''
            />
          </form>
        </CardAction>
      </CardHeader>

      <CardContent className='flex flex-col md:flex-row md:items-center md:justify-evenly gap-6 overflow-auto'>
        {isYearlyDataPresent ? (
          <>
            <YearlyTotalTrendAreaChart chartConfig={chartConfig} yearlyData={yearlyData} />
            <YearlyBreakdownBarChart
              yearlyData={yearlyData}
              chartConfig={chartConfig}
              selectedCategory={selectedCategory}
              categoryTotals={categoryTotals}
            />
          </>
        ) : (
          <div className='flex justify-center py-24 text-muted-foreground'>
            No data available for the selected year.
          </div>
        )}
      </CardContent>
      <CardHeader>
        <CardTitle>{selectedMonth} Month – Category Breakdown</CardTitle>
        {/* <CardDescription>Monthly trend & category-wise breakdown</CardDescription> */}
      </CardHeader>
      <CardContent className='space-y-10 flex flex-col md:flex-row md:items-center md:justify-evenly gap-6 overflow-auto'>
        {chartData.length > 0 ? (
          <>
            <MonthlyBreakdownBarChart
              chartData={[...chartData].sort((a, b) => b.amount - a.amount)}
              categoryColors={categoryColors}
            />
            <MonthlyBreakdownPieChart chartData={chartData} chartConfig={chartConfig} />
          </>
        ) : (
          <div className='text-muted-foreground'>No data available for this month.</div>
        )}
      </CardContent>
    </Card>
  );
};
