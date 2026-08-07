import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import ExpensesService from "@/services/ExpensesService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { MultiYearTrendAreaChart } from "./MultiYearTrendAreaChart";
import { MultiYearTotalInvestmentLineChart } from "./MultiYearTotalInvestmentLineChart";
import { YearRangeSelect, EARLIEST_YEAR, CURRENT_YEAR, allYears } from "./YearRangeSelect";

export const MultiYearOverview = () => {
  const [startYear, setStartYear] = useState<number>(EARLIEST_YEAR);
  const [endYear, setEndYear] = useState<number>(CURRENT_YEAR);

  const fullYearList = allYears();

  const service = new ExpensesService();
  const results = useQueries({
    queries: fullYearList.map((year) => ({
      queryKey: ["monthly-consolidated", year],
      queryFn: () => service.getMonthlyConsolidatedPivotTable(year),
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);
  const visibleYears = fullYearList.filter((y) => y >= startYear && y <= endYear);

  return (
    <Card className='border-0 space-y-6'>
      <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-0'>
        <div>
          <CardTitle>Expense Overview for All Years</CardTitle>
          <CardDescription>Multi-year spending and investment trends</CardDescription>
        </div>

        <YearRangeSelect
          startYear={startYear}
          setStartYear={setStartYear}
          endYear={endYear}
          setEndYear={setEndYear}
          fullYearList={fullYearList}
        />
      </CardHeader>

      <CardContent className='space-y-6'>
        <MultiYearTrendAreaChart
          visibleYears={visibleYears}
          fullYearList={fullYearList}
          results={results}
          isLoading={isLoading}
        />

        <MultiYearTotalInvestmentLineChart
          visibleYears={visibleYears}
          fullYearList={fullYearList}
          results={results}
          isLoading={isLoading}
        />
      </CardContent>
    </Card>
  );
};
