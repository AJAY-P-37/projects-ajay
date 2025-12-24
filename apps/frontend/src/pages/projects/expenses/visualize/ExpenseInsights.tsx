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
import { Amphora, Loader2 } from "lucide-react";
import { YearlyTotalTrendAreaChart } from "./Charts/YearlyTotalTrendAreaChart";
// import { YearlyCategoryStackedBarChart } from "./Charts/YearlyCategoryStackedBarChart";
import { MonthlyBreakdownBarChart } from "./Charts/MonthlyBreakdownBarChart";
import { FormSelect } from "@/components/common/storybook/select";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import {
  currentMonthName,
  currentYear,
  months,
  years,
} from "../monthlyTracker/MonthlyExpensesFormSchema";
import { MonthlyBreakdownPieChart } from "./Charts/MonthlyBreakdownPieChart";
import { YearlyBreakdownBarChart } from "./Charts/YearlyBreakdownBarChart";
import { Loader } from "@/components/common/storybook/loader";
import { YearlyCategoryStackedBarChart } from "./Charts/YearlyCategoryStackedBarChart";
import { YearlyCategoryBreakdownBarChart } from "./Charts/YearlyBreakdownCategoryBarChart";
import { YearlyBreakdownCategoryPieChart } from "./Charts/YearlyBreakdownCategoryPieChart";
import { KpiCard } from "./Charts/KPICard";

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

export const ExpenseInsights = () => {
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
    return <Loader />;
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

  interface YearlyData {
    month: string;
    Total: number;
    TotalExcludingInvestment: number;
  }

  const yearlyData: YearlyData[] = monthsAvailable.map((m) => {
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
    KPI Card
  ----------------------------- */

  const monthlyAverage =
    yearlyData.reduce((sum, month) => sum + month.Total, 0) / monthsAvailable.length;
  // const monthlyInvestmentAverage = yearlyData.reduce((sum, month) => sum + month.Investment, 0);

  const { month: highestMonthlabel, Total: highestMonthamount } = [...yearlyData].sort(
    (a, b) => b.Total - a.Total,
  )[0];

  /* ----------------------------
     SELECTED MONTH DETAILS
  ----------------------------- */
  const monthDetail = monthsAvailable.find((m) => m.month === selectedMonth);

  const monthlyChartData = monthDetail.data.filter((d) => d.category !== "Total" && d.amount > 0);

  /* ----------------------------
     SELECTED Category DETAILS
  ----------------------------- */
  const categoryTotals: Record<string, number> = { Total: 0 };

  let topCategory = { category: null, amount: 0 };

  yearlyData.forEach((row) => {
    categoryTotals.Total += row.Total || 0;
    categories.forEach((cat) => {
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (row[cat] || 0);
      if (topCategory.amount <= categoryTotals[cat]) {
        topCategory.amount = categoryTotals[cat];
        topCategory.category = cat;
      }
    });
  });

  return (
    <div className='space-y-10'>
      {/* ===================== YEARLY OVERVIEW ===================== */}
      <Card className='border-0'>
        <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle>Expense Overview – {selectedYear}</CardTitle>
            <CardDescription>Monthly trend and category-wise breakdown</CardDescription>
          </div>

          <FormSelect
            name='year'
            options={years}
            control={control}
            label=''
            className='w-[120px]'
          />
        </CardHeader>

        <CardContent className='space-y-6'>
          {isYearlyDataPresent ? (
            <>
              {/* ---- KPI ROW (recommended) ---- */}
              {/* <YearlyKpiSummary totals={...} /> */}
              <div className='grid grid-cols-2 lg:grid-cols-4 gap-4'>
                <KpiCard label='Total Spend' value={`₹${categoryTotals.Total.toLocaleString()}`} />

                <KpiCard label='Monthly Average' value={`₹${monthlyAverage.toLocaleString()}`} />

                <KpiCard
                  label='Highest Month'
                  value={highestMonthlabel}
                  subText={`₹${highestMonthamount.toLocaleString()}`}
                />

                <KpiCard
                  label='Top Category'
                  value={topCategory.category}
                  subText={`₹${topCategory?.amount?.toLocaleString()}`}
                />
              </div>

              {/* ---- HERO CHART ---- */}
              <div className='space-y-6'>
                {/* <div className='xl:col-span-2'> */}
                <YearlyTotalTrendAreaChart chartConfig={chartConfig} yearlyData={yearlyData} />
                {/* </div> */}

                <YearlyBreakdownBarChart
                  control={control}
                  categories={categories}
                  yearlyData={yearlyData}
                  chartConfig={chartConfig}
                  selectedCategory={selectedCategory}
                  categoryTotals={categoryTotals}
                />
              </div>

              {/* ---- CATEGORY COMPARISON ---- */}
              <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 border rounded-md py-4'>
                <YearlyCategoryBreakdownBarChart
                  categoryColors={categoryColors}
                  categoryTotals={categoryTotals}
                />

                <YearlyBreakdownCategoryPieChart
                  chartConfig={chartConfig}
                  categoryTotals={categoryTotals}
                />
              </div>
            </>
          ) : (
            <div className='flex justify-center py-24 text-muted-foreground'>
              No data available for the selected year.
            </div>
          )}
        </CardContent>
      </Card>

      {/* ===================== MONTHLY BREAKDOWN ===================== */}
      <Card className='m-0 border-0 sm:border-1'>
        <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
          <div>
            <CardTitle>
              Expense Overview – {selectedYear} {selectedMonth}
            </CardTitle>
            <CardDescription>Where your money went this month</CardDescription>
          </div>

          <FormSelect
            name='month'
            options={months.map((m) => ({ ...m, value: m.label }))}
            control={control}
            label=''
            className='w-[140px]'
          />
        </CardHeader>

        <CardContent className='px-6'>
          {monthlyChartData.length > 0 ? (
            <div className='grid grid-cols-1 xl:grid-cols-2 gap-6 border rounded-sm py-4'>
              <MonthlyBreakdownBarChart
                chartData={[...monthlyChartData].sort((a, b) => b.amount - a.amount)}
                categoryColors={categoryColors}
              />

              <MonthlyBreakdownPieChart chartData={monthlyChartData} chartConfig={chartConfig} />
            </div>
          ) : (
            <div className='py-20 text-center text-muted-foreground'>
              No data available for the selected month.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
