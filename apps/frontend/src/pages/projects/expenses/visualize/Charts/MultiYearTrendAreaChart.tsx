import { useState } from "react";
import { useQueries, UseQueryResult } from "@tanstack/react-query";
import ExpensesService from "@/services/ExpensesService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { Loader2 } from "lucide-react";
import {
  YearRangeSelect,
  CURRENT_YEAR,
  allYears,
  fmtCurrency,
  getYearColor,
  YEAR_COLORS,
} from "./YearRangeSelect";
import { useUserSettings } from "@/hooks/useUserSettings";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

interface MonthPoint {
  month: string;
  [year: string]: number | string;
}

export interface MultiYearChartProps {
  visibleYears?: number[];
  fullYearList?: number[];
  results?: UseQueryResult<any, unknown>[];
  isLoading?: boolean;
}

export const MultiYearTrendAreaChart = ({
  visibleYears: propVisibleYears,
  fullYearList: propFullYearList,
  results: propResults,
  isLoading: propIsLoading,
}: MultiYearChartProps) => {
  const { startYear: earliestYear } = useUserSettings();
  const [startYear, setStartYear] = useState<number>(earliestYear);
  const [endYear, setEndYear] = useState<number>(CURRENT_YEAR);

  const isStandalone = !propResults;
  const fullYearList = propFullYearList ?? allYears(earliestYear);

  const service = new ExpensesService();
  const queriesResults = useQueries({
    queries: isStandalone
      ? fullYearList.map((year) => ({
          queryKey: ["monthly-consolidated", year],
          queryFn: () => service.getMonthlyConsolidatedPivotTable(year),
          retry: false,
          refetchOnWindowFocus: false,
          staleTime: 5 * 60 * 1000,
        }))
      : [],
  });

  const results = isStandalone ? queriesResults : propResults!;
  const isLoading = isStandalone ? results.some((r) => r.isLoading) : propIsLoading;
  const visibleYears = isStandalone
    ? fullYearList.filter((y) => y >= startYear && y <= endYear)
    : propVisibleYears!;

  /* ---- Build chart data ---- */
  const chartData: MonthPoint[] = MONTH_NAMES.map((monthName) => {
    const point: MonthPoint = { month: monthName.slice(0, 3) };
    results.forEach((result, idx) => {
      const year = fullYearList[idx];
      if (!visibleYears.includes(year)) return;
      if (!result.data?.months) return;
      const monthRow = result.data.months.find((m: any) => m.month === monthName);
      const total = monthRow?.data?.find((d: any) => d.category === "Total")?.amount ?? null;
      const investment =
        monthRow?.data?.find((d: any) => d.category === "Investment")?.amount ?? 0;
      const insurance =
        monthRow?.data?.find((d: any) => d.category === "Insurance")?.amount ?? 0;
      point[String(year)] = total !== null ? total - (investment + insurance) : null;
    });
    return point;
  });

  const hasData = visibleYears.some((year) => {
    const idx = fullYearList.indexOf(year);
    const result = results[idx];
    return result?.data?.months?.some((m: any) =>
      m.data?.some((d: any) => d.amount > 0)
    );
  });

  return (
    <Card className='py-0 border'>
      <CardHeader className='flex flex-col items-stretch border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3'>
          <CardTitle>Year-over-Year Monthly Trend</CardTitle>
          <CardDescription>Monthly expenses across years (excl. investment & insurance)</CardDescription>
        </div>

        {isStandalone && (
          <div className='flex items-center p-2 gap-2 text-sm'>
            <YearRangeSelect
              startYear={startYear}
              setStartYear={setStartYear}
              endYear={endYear}
              setEndYear={setEndYear}
              fullYearList={fullYearList}
            />
          </div>
        )}
      </CardHeader>

      <CardContent className='px-2 pt-4'>
        {isLoading ? (
          <div className='flex justify-center items-center h-[250px]'>
            <Loader2 className='animate-spin text-muted-foreground' size={32} />
          </div>
        ) : !hasData ? (
          <div className='flex justify-center py-20 text-muted-foreground'>
            No data available for the selected years.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={250}>
            <AreaChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
              <defs>
                {visibleYears.map((year, idx) => (
                  <linearGradient key={year} id={`grad-${year}`} x1='0' y1='0' x2='0' y2='1'>
                    <stop
                      offset='5%'
                      stopColor={getYearColor(idx)}
                      stopOpacity={0.35}
                    />
                    <stop
                      offset='95%'
                      stopColor={getYearColor(idx)}
                      stopOpacity={0}
                    />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' />
              <XAxis dataKey='month' tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                width={55}
              />
              <Tooltip
                formatter={(value: number, name: string) => [fmtCurrency.format(value), name]}
                labelFormatter={(label) => `Month: ${label}`}
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  color: "var(--card-foreground)",
                  fontSize: 13,
                }}
              />
              <Legend
                iconType='circle'
                iconSize={8}
                wrapperStyle={{ fontSize: 13, paddingTop: 8 }}
              />

              {visibleYears.map((year, idx) => (
                <Area
                  key={year}
                  type='monotone'
                  dataKey={String(year)}
                  name={String(year)}
                  stroke={getYearColor(idx)}
                  fill={`url(#grad-${year})`}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};
