import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "shadcn-lib/dist/components/ui/chart";

interface ChartBarInteractiveProps {
  yearlyData: any[];
  chartConfig: ChartConfig;
  selectedCategory: string;
  categoryTotals: Record<string, number>;
}

export function YearlyBreakdownBarChart({
  yearlyData,
  chartConfig,
  selectedCategory,
  categoryTotals,
}: ChartBarInteractiveProps) {
  return (
    <Card className='py-0'>
      <CardHeader className='flex flex-col items-stretch border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3'>
          <CardTitle>Yearly Breakdown</CardTitle>
          <CardDescription>Category</CardDescription>
        </div>
        <div className='flex overflow-x-auto'>
          <div className='data-[active=true]:bg-muted/50 flex flex-col justify-center gap-1 border-l px-6 py-4 text-left'>
            <span className='text-muted-foreground text-xs'>
              {chartConfig[selectedCategory]?.label}
            </span>
            <span className='text-md font-semibold'>
              ₹{(categoryTotals[selectedCategory] || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className='px-2'>
        <ChartContainer config={chartConfig} className='h-[250px] w-full'>
          <BarChart data={yearlyData} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} strokeOpacity={0.2} />

            <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} />

            <YAxis tickFormatter={(v) => `₹${v / 1000}k`} tickLine={false} axisLine={false} />

            <ChartTooltip content={<ChartTooltipContent />} />

            <Bar
              dataKey={selectedCategory}
              radius={[6, 6, 0, 0]}
              fill={`var(--color-${selectedCategory})`}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
