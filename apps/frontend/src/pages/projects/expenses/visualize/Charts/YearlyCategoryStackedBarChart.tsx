import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "shadcn-lib/dist/components/ui/chart";
import { XAxis, YAxis, BarChart, Legend, Bar, ResponsiveContainer } from "recharts";
/* ===========================
  STACKED CATEGORY BARS
============================ */
export const YearlyCategoryStackedBarChart = ({ chartConfig, yearlyData, categories }) => {
  return (
    <ChartContainer className='h-[360px] w-[100%]' config={chartConfig}>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={yearlyData}>
          <XAxis dataKey='month' />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent indicator='dot' />} />
          <Legend />

          {categories.map((cat) => (
            <Bar key={cat} dataKey={cat} stackId='a' fill={chartConfig[cat].color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};
