import { FormSelect } from "@/components/common/storybook/select";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import {
  Card,
  CardAction,
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
import { IExpensesVisualConfig } from "../ExpenseInsights";
import { Control } from "react-hook-form";

interface ChartBarInteractiveProps {
  control: Control<IExpensesVisualConfig, any, IExpensesVisualConfig>;
  categories: string[];
  yearlyData: any[];
  chartConfig: ChartConfig;
  selectedCategory: string;
  categoryTotals: Record<string, number>;
}

export function YearlyBreakdownBarChart({
  control,
  categories,
  yearlyData,
  chartConfig,
  selectedCategory,
  categoryTotals,
}: ChartBarInteractiveProps) {
  return (
    <Card className='py-0'>
      <CardHeader className='flex flex-col items-stretch border-b !p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-4 pt-4 pb-3'>
          <CardTitle>Yearly Breakdown</CardTitle>
          <CardDescription>Category</CardDescription>
        </div>
        <div className='flex overflow-x-auto'>
          <div className='data-[active=true]:bg-muted/50 flex flex-col flex-1 justify-center gap-1 border-t sm:border-t-0 sm:border-l px-6 py-4 text-left'>
            <span className='text-muted-foreground text-xs'>
              Total {chartConfig[selectedCategory]?.label}
            </span>
            <span className='text-md font-semibold'>
              ₹{(categoryTotals[selectedCategory] || 0).toLocaleString()}
            </span>
          </div>
        </div>
        <div className='flex items-center p-1 sm:border-l'>
          <CardAction className='self-center p-2'>
            <FormSelect
              name='category'
              options={[
                { label: "Total", value: "Total" },
                ...categories.map((key) => ({ label: key, value: key })),
              ]}
              control={control}
              label=''
              className='w-36'
            />
          </CardAction>
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
