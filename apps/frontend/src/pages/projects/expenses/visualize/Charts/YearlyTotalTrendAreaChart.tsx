import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "shadcn-lib/dist/components/ui/chart";
import { AreaChart, CartesianGrid, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";

/* ===========================
    TOTAL TREND (AREA CHART)
============================ */
export const YearlyTotalTrendAreaChart = ({ chartConfig, yearlyData }) => {
  const trends = [
    // { label: "Total", key: "Total" },
    { label: "Total Expense", key: "TotalExcludingInvestment" },
    { label: "Total Investment", key: "Investment" },
  ];
  const categoryTotals: Record<string, number> = {
    Total: 0,
    TotalExcludingInvestment: 0,
    Investment: 0,
  };

  yearlyData.forEach((row) => {
    // categoryTotals.Total += row.Total || 0;
    categoryTotals.TotalExcludingInvestment += row.TotalExcludingInvestment || 0;
    categoryTotals.Investment += row.Investment || 0;
  });
  return (
    <Card className='py-0'>
      <CardHeader className='flex flex-col items-stretch border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3'>
          <CardTitle>Yearly Trend</CardTitle>
          <CardDescription>Expense vs Investment</CardDescription>
        </div>
        {trends.map((trend) => (
          <div className='flex overflow-x-auto' key={trend.key}>
            <div className='data-[active=true]:bg-muted/50 flex flex-col flex-1 justify-center gap-1 border-t sm:border-t-0 sm:border-l px-6 py-4 text-left'>
              <span className='text-muted-foreground text-xs'>{trend.label}</span>
              <span className='text-md font-semibold'>
                ₹{(categoryTotals[trend.key] || 0).toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </CardHeader>
      <CardContent className='px-2'>
        <ChartContainer className='h-[250px] w-[100%]' config={chartConfig}>
          <ResponsiveContainer width='100%' height='100%'>
            <AreaChart data={yearlyData} accessibilityLayer>
              <XAxis dataKey='month' />
              <YAxis />
              <ChartTooltip content={<ChartTooltipContent />} />
              {/* <Area
                type='monotone'
                dataKey='Total'
                stroke='var(--chart-1)'
                fill='var(--chart-1)'
                fillOpacity={0.3}
                name='Total'
              /> */}
              <Area
                type='monotone'
                dataKey='Investment'
                stroke='var(--chart-2)'
                fill='var(--chart-2)'
                fillOpacity={0.3}
                name='Total Investment'
              />
              <Area
                type='monotone'
                dataKey='TotalExcludingInvestment'
                stroke='var(--chart-5)'
                fill='var(--chart-5)'
                fillOpacity={0.3}
                name='Total Expense'
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
