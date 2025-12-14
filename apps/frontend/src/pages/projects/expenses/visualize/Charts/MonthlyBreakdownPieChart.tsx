import {
  XAxis,
  YAxis,
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  Tooltip,
  LabelList,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "shadcn-lib/dist/components/ui/card";
import { Pie, PieChart } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "shadcn-lib/dist/components/ui/chart";

const renderSliceLabel = ({ cx, cy, midAngle, outerRadius, percent }: any) => {
  // Hide very small slices → tooltip only
  //   if (percent < 0.02) return null;

  const RADIAN = Math.PI / 180;

  const radius = outerRadius + 28;

  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  const isRight = x > cx;

  return (
    <text
      x={x}
      y={y}
      textAnchor={isRight ? "start" : "end"}
      dominantBaseline='central'
      className='fill-foreground text-xs font-medium'
    >
      {(percent * 100).toFixed(1)}%
    </text>
  );
};

export const MonthlyBreakdownPieChart = ({ chartConfig, chartData }) => {
  const totalAmount = chartData.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className='min-w-[500px] h-[400px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <ChartContainer config={chartConfig} className='mx-auto aspect-square'>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />

            <Pie
              data={chartData}
              dataKey='amount'
              nameKey='category'
              innerRadius={75}
              outerRadius={150}
              paddingAngle={5}
              label={renderSliceLabel}
            >
              {chartData.map((entry) => (
                <Cell key={entry.category} fill={`var(--color-${entry.category})`} />
              ))}

              <Label
                position='center'
                content={({ viewBox }) => {
                  if (!viewBox) return null;

                  const { cx, cy } = viewBox as any;
                  return (
                    <text x={cx} y={cy} textAnchor='middle' dominantBaseline='middle'>
                      <tspan x={cx} dy='-0.4em' className='fill-foreground text-xs'>
                        Total
                      </tspan>
                      <tspan x={cx} dy='1.3em' className='fill-foreground text-sm font-semibold'>
                        ₹{totalAmount.toLocaleString()}
                      </tspan>
                    </text>
                  );
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  );
};
