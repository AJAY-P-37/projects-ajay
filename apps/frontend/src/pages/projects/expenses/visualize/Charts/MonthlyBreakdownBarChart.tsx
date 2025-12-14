import {
  XAxis,
  YAxis,
  BarChart,
  Bar,
  ResponsiveContainer,
  Cell,
  Tooltip,
  LabelList,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "shadcn-lib/dist/components/ui/card";

/* ===========================
  MONTH BREAKDOWN TABLE
============================ */
interface MonthlyBreakdownChartProps {
  chartData: { category: string; amount: number }[];

  categoryColors: Record<string, string>;
}

export const MonthlyBreakdownBarChart = ({
  chartData,
  categoryColors,
}: MonthlyBreakdownChartProps) => {
  return (
    <div className='min-w-[500px] h-[400px]'>
      <ResponsiveContainer width='100%' height='100%'>
        <BarChart data={chartData} layout='vertical' margin={{ right: 80, left: 20 }}>
          {/* <CartesianGrid
            vertical
            horizontal={false}
            strokeDasharray='3 3'
            stroke='rgba(255,255,255,0.08)'
          /> */}

          <XAxis type='number' tickFormatter={(v) => `₹${v / 1000}k`} />

          <CartesianGrid stroke='var(--chart-grid)' strokeDasharray='3 3' />
          <YAxis type='category' dataKey='category' width={120} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const { category, amount } = payload[0].payload;

              return (
                <div className='rounded-md border bg-background px-3 py-2 text-xs shadow-md'>
                  <div className='font-medium'>{category}</div>
                  <div className='text-muted-foreground'>₹{amount.toLocaleString()}</div>
                </div>
              );
            }}
          />
          <Bar dataKey='amount' radius={[0, 6, 6, 0]}>
            {chartData.map((entry) => (
              <Cell key={entry.category} fill={categoryColors[entry.category]} />
            ))}

            <LabelList
              dataKey='amount'
              position='right'
              formatter={(v: number) => `₹${v.toLocaleString()}`}
              className='fill-card-foreground text-xs'
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
