import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import IncomeService from "@/services/IncomeService";
import ExpensesService from "@/services/ExpensesService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { Button } from "shadcn-lib/dist/components/ui/button";
import { Input } from "shadcn-lib/dist/components/ui/input";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "shadcn-lib/dist/components/ui/chart";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Line,
  ComposedChart,
} from "recharts";
import { Loader } from "@/components/common/storybook/loader";
import { FormSelect } from "@/components/common/storybook/select";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { currentYear, years } from "../../expenses/monthlyTracker/MonthlyExpensesFormSchema";
import {
  Wallet,
  Coins,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Landmark,
  Pencil,
  Check,
  Sparkles,
  Receipt,
  Info,
} from "lucide-react";

const schema = z.object({ year: z.string().min(1) });
type FormData = z.infer<typeof schema>;

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const round = (v: number) =>
  Math.round((parseFloat(v.toString()) + Number.EPSILON) * 100) / 100;
const fmt = (v: number) => `₹${Math.round(v).toLocaleString("en-IN")}`;

export const FinancialInsights = () => {
  const formHook: UseFormReturn<FormData> = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { year: currentYear },
  });
  const { control, watch } = formHook;
  const selectedYear = Number(watch("year"));

  // ── Opening Balance State (Persisted in localStorage per year) ──
  const storageKey = `financial_insights_opening_balance_${selectedYear}`;
  const [openingBalance, setOpeningBalance] = useState<number>(() => {
    const saved = localStorage.getItem(storageKey);
    return saved ? Number(saved) : 0;
  });
  const [isEditingOpeningBalance, setIsEditingOpeningBalance] = useState(false);
  const [openingBalanceInput, setOpeningBalanceInput] = useState(String(openingBalance));

  // Sync state on year switch
  useEffect(() => {
    const saved = localStorage.getItem(`financial_insights_opening_balance_${selectedYear}`);
    const val = saved ? Number(saved) : 0;
    setOpeningBalance(val);
    setOpeningBalanceInput(String(val));
    setIsEditingOpeningBalance(false);
  }, [selectedYear]);

  const handleSaveOpeningBalance = () => {
    const num = Number(openingBalanceInput) || 0;
    setOpeningBalance(num);
    localStorage.setItem(storageKey, String(num));
    setIsEditingOpeningBalance(false);
  };

  // Trajectory Chart View: "cash" (Leftover in hand) vs "wealth" (Cash + Cumulative Investments)
  const [trajectoryMode, setTrajectoryMode] = useState<"cash" | "wealth">("cash");

  // Fetch income pivot
  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ["income-monthly-pivot", selectedYear],
    queryFn: () => new IncomeService().getMonthlyConsolidatedPivotTable(selectedYear),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Fetch expense pivot
  const { data: expenseData, isLoading: expenseLoading } = useQuery({
    queryKey: ["expense-monthly-pivot", selectedYear],
    queryFn: () => new ExpensesService().getMonthlyConsolidatedPivotTable(selectedYear),
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (incomeLoading || expenseLoading) return <Loader />;

  // ── Build month-by-month combined data ──────────────────────────
  interface MonthRow {
    month: string;
    income: number;
    earnedIncome: number;     // Total income excluding investment return principal
    expenses: number;         // Core living expenses (excluding investment & insurance)
    insurance: number;
    investmentDeployed: number;
    investmentReturned: number;
    totalOutflows: number;    // All cash leaving hand (living + insurance + invested)
    net: number;              // Monthly cash delta (income − totalOutflows)
    cumCashInHand: number;    // Cumulative cash left in hand (starting from opening balance)
    cumInvested: number;      // Active investment portfolio (deployed − returned, never negative)
    netWealth: number;        // cumCashInHand + cumInvested (no double-counting)
    hasData: boolean;
  }

  let runningCash = openingBalance;
  let runningNetDeployed = 0;

  const monthlyRows: MonthRow[] = MONTHS_FULL.map((m, idx) => {
    const incomeMonth = incomeData?.months?.find((x: any) => x.month === m);
    const expenseMonth = expenseData?.months?.find((x: any) => x.month === m);

    const totalIncome = incomeMonth?.data?.find((d: any) => d.source === "Total")?.amount ?? 0;
    const investmentReturned = incomeMonth?.data?.find((d: any) => d.source === "Investment Return")?.amount ?? 0;
    const earnedIncome = round(Math.max(0, totalIncome - investmentReturned));

    const totalExpense = expenseMonth?.data?.find((d: any) => d.category === "Total")?.amount ?? 0;
    const investmentDeployed = expenseMonth?.data?.find((d: any) => d.category === "Investment")?.amount ?? 0;
    const insurance = expenseMonth?.data?.find((d: any) => d.category === "Insurance")?.amount ?? 0;
    const coreExpenses = round(Math.max(0, totalExpense - investmentDeployed - insurance));
    const livingExpenses = round(coreExpenses + insurance);

    const totalOutflows = round(livingExpenses + investmentDeployed);
    const monthlyNet = round(totalIncome - totalOutflows);

    runningCash = round(runningCash + monthlyNet);
    runningNetDeployed = round(runningNetDeployed + investmentDeployed - investmentReturned);
    const activePortfolio = Math.max(0, runningNetDeployed);
    const netWealth = round(runningCash + activePortfolio);

    const hasData = totalIncome > 0 || totalExpense > 0;

    return {
      month: MONTH_ABBR[idx],
      income: round(totalIncome),
      earnedIncome,
      expenses: round(coreExpenses),
      insurance: round(insurance),
      investmentDeployed: round(investmentDeployed),
      investmentReturned: round(investmentReturned),
      totalOutflows,
      net: monthlyNet,
      cumCashInHand: runningCash,
      cumInvested: activePortfolio,
      netWealth,
      hasData,
    };
  });

  // ── Year-to-Date & High-water Marks ──────────────────────────────
  const activeMonths = monthlyRows.filter((r) => r.hasData);
  const latestMonthRow = activeMonths[activeMonths.length - 1] ?? monthlyRows[0];

  const currentCashInHand = latestMonthRow ? latestMonthRow.cumCashInHand : openingBalance;
  const currentActiveInvested = latestMonthRow ? latestMonthRow.cumInvested : 0;
  const currentNetWealth = latestMonthRow ? latestMonthRow.netWealth : openingBalance;

  const peakCashInHand = Math.max(...monthlyRows.map((r) => r.cumCashInHand), openingBalance);
  const peakMonth = monthlyRows.find((r) => r.cumCashInHand === peakCashInHand)?.month ?? "Jan";

  const totalGrossIncome = round(monthlyRows.reduce((s, r) => s + r.income, 0));
  const totalIncome = totalGrossIncome;
  const totalReturned = round(monthlyRows.reduce((s, r) => s + r.investmentReturned, 0));
  const totalEarnedIncome = round(Math.max(0, totalGrossIncome - totalReturned));
  const totalCoreExpenses = round(monthlyRows.reduce((s, r) => s + r.expenses, 0));
  const totalInsurance = round(monthlyRows.reduce((s, r) => s + r.insurance, 0));
  const totalLivingCost = round(totalCoreExpenses + totalInsurance);
  const totalInvested = round(monthlyRows.reduce((s, r) => s + r.investmentDeployed, 0));
  const totalNetSavings = round(totalGrossIncome - totalLivingCost - totalInvested);

  const netProfitRealized = Math.max(0, round(totalReturned - totalInvested));
  const savingsRate = totalEarnedIncome > 0 ? round(((totalEarnedIncome - totalLivingCost) / totalEarnedIncome) * 100) : 0;

  // ── Runway & Buffer Analysis ─────────────────────────────────────
  const avgMonthlyBurn = activeMonths.length > 0 ? totalLivingCost / activeMonths.length : 0;
  const runwayMonths = avgMonthlyBurn > 0 ? round(currentCashInHand / avgMonthlyBurn) : 0;

  const hasData = monthlyRows.some((r) => r.income > 0 || r.expenses > 0);

  const chartConfig: ChartConfig = {
    cumCashInHand: { label: "Cash in Hand", color: "hsl(150, 75%, 40%)" },
    netWealth: { label: "Total Net Wealth", color: "hsl(217, 91%, 60%)" },
    income: { label: "Income", color: "var(--chart-2)" },
    expenses: { label: "Core Expenses", color: "var(--chart-5)" },
    investmentDeployed: { label: "Invested", color: "var(--chart-3)" },
    investmentReturned: { label: "Investment Return", color: "var(--chart-1)" },
    net: { label: "Monthly Surplus", color: "var(--chart-4)" },
  };

  return (
    <div className='space-y-8 mx-3 my-6'>
      {/* =========================================================
          HEADER & OPENING BALANCE CONTROLS
      ========================================================= */}
      <Card className='border-0 shadow-sm'>
        <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4'>
          <div>
            <CardTitle className='text-2xl font-bold flex items-center gap-2'>
              <Landmark className='w-6 h-6 text-primary' />
              Financial Insights – {selectedYear}
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Track cumulative leftover cash in hand, liquid runway, and asset growth over time.
            </CardDescription>
          </div>

          <div className='flex flex-wrap items-center gap-3 self-start md:self-auto'>
            {/* Opening Balance Configuration */}
            <div className='flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border text-xs'>
              <Wallet className='w-4 h-4 text-primary' />
              <span className='font-medium text-muted-foreground'>Starting Bank Balance:</span>
              {isEditingOpeningBalance ? (
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    value={openingBalanceInput}
                    onChange={(e) => setOpeningBalanceInput(e.target.value)}
                    placeholder='0'
                    className='h-7 w-24 text-xs py-0 px-2 font-semibold'
                    autoFocus
                  />
                  <Button size='sm' className='h-7 px-2 text-xs' onClick={handleSaveOpeningBalance}>
                    <Check className='w-3.5 h-3.5 mr-1' /> Set
                  </Button>
                </div>
              ) : (
                <div className='flex items-center gap-1.5'>
                  <strong className='text-foreground'>{fmt(openingBalance)}</strong>
                  <button
                    onClick={() => setIsEditingOpeningBalance(true)}
                    className='text-muted-foreground hover:text-foreground transition p-0.5'
                    title='Edit starting balance on Jan 1st'
                  >
                    <Pencil className='w-3 h-3' />
                  </button>
                </div>
              )}
            </div>

            <FormSelect name='year' options={years} control={control} label='' className='!w-24' />
          </div>
        </CardHeader>
      </Card>

      {hasData ? (
        <div className='space-y-6'>
          {/* =========================================================
              PRIMARY KPIS (IN HAND & RUNWAY SPOTLIGHT)
          ========================================================= */}
          <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
            {/* 1. Cash in Hand (Current Leftover) */}
            <Card className='border border-emerald-500/30 bg-emerald-500/5 shadow-xs'>
              <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Left Over in Hand</span>
                  <Wallet className='w-4 h-4 text-emerald-500' />
                </div>
                <div className='text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400'>
                  {fmt(currentCashInHand)}
                </div>
                <div className='text-[11px] text-muted-foreground truncate'>
                  {currentCashInHand >= openingBalance ? (
                    <span className='text-emerald-600 font-medium flex items-center gap-0.5 whitespace-nowrap'>
                      <TrendingUp className='w-3 h-3' /> +{fmt(currentCashInHand - openingBalance)} this year
                    </span>
                  ) : (
                    <span className='text-rose-500 font-medium flex items-center gap-0.5 whitespace-nowrap'>
                      <TrendingDown className='w-3 h-3' /> -{fmt(openingBalance - currentCashInHand)} this year
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 2. Runway / Emergency Buffer */}
            <Card className='border shadow-xs'>
              <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Emergency Runway</span>
                  <ShieldCheck className='w-4 h-4 text-primary' />
                </div>
                <div className='text-2xl font-bold tracking-tight'>
                  {runwayMonths > 0 ? `${runwayMonths} mos` : "—"}
                </div>
                <div className='text-[11px] text-muted-foreground truncate'>
                  {runwayMonths >= 6 ? (
                    <span className='text-emerald-500 font-medium'>Solid Safety Buffer 🛡️</span>
                  ) : runwayMonths >= 3 ? (
                    <span className='text-amber-500 font-medium'>Moderate Buffer ⚠️</span>
                  ) : (
                    <span className='text-rose-500 font-medium'>Tight Cash Cushion 🚨</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 3. Total Net Wealth (Cash + Assets) */}
            <Card className='border border-primary/20 bg-primary/5 shadow-xs'>
              <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Net Wealth Built</span>
                  <PiggyBank className='w-4 h-4 text-primary' />
                </div>
                <div className='text-2xl font-bold tracking-tight text-foreground'>
                  {fmt(currentNetWealth)}
                </div>
                <div className='text-[11px] text-muted-foreground truncate' title={`Cash: ${fmt(currentCashInHand)} | Assets: ${fmt(currentActiveInvested)}`}>
                  Cash ({fmt(currentCashInHand)}) + Assets ({fmt(currentActiveInvested)})
                </div>
              </CardContent>
            </Card>

            {/* 4. Real Earned Income */}
            <Card className='border shadow-xs'>
              <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Earned Income</span>
                  <Coins className='w-4 h-4 text-muted-foreground' />
                </div>
                <div className='text-2xl font-bold tracking-tight text-foreground'>
                  {fmt(totalEarnedIncome)}
                </div>
                <div className='text-[11px] text-muted-foreground truncate'>
                  {totalReturned > 0 ? (
                    <span className='text-emerald-600 font-medium'>+{fmt(totalReturned)} returned</span>
                  ) : (
                    <span>Real wages & earnings</span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* 5. Living Outflows */}
            <Card className='border shadow-xs'>
              <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Living Expenses</span>
                  <Receipt className='w-4 h-4 text-rose-500/70' />
                </div>
                <div className='text-2xl font-bold tracking-tight text-foreground'>
                  {fmt(totalLivingCost)}
                </div>
                <div className='text-[11px] text-rose-500 font-medium truncate'>
                  Core + Insurance
                </div>
              </CardContent>
            </Card>

            {/* 6. Active Portfolio (Consolidated) */}
            <Card className='border shadow-xs'>
              <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
                <div className='flex items-center justify-between text-xs text-muted-foreground'>
                  <span>Active Portfolio</span>
                  <Sparkles className='w-4 h-4 text-amber-500' />
                </div>
                <div className='text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400'>
                  {fmt(currentActiveInvested)}
                </div>
                <div className='text-[11px] text-muted-foreground truncate' title={`Deployed: ${fmt(totalInvested)} | Returned: ${fmt(totalReturned)}`}>
                  Deployed: {fmt(totalInvested)} | Returned: {fmt(totalReturned)}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* =========================================================
              INVESTMENT FLOW CONSOLIDATION BANNER
          ========================================================= */}
          <Card className='border bg-muted/20 shadow-xs'>
            <CardContent className='p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-primary/10 rounded-lg text-primary'>
                  <Landmark className='w-4 h-4' />
                </div>
                <div>
                  <div className='font-semibold text-foreground text-sm flex items-center gap-2'>
                    Investment Flow Consolidation
                    <span className='text-[10px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium'>
                      No Double-Counting
                    </span>
                  </div>
                  <div className='text-muted-foreground text-[11px]'>
                    Investments deployed convert liquid cash into assets. Liquidating investments moves assets back into cash.
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-4 text-xs'>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Gross Deployed:</span>
                  <strong className='text-foreground'>{fmt(totalInvested)}</strong>
                </div>
                <div className='text-muted-foreground font-bold'>−</div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Liquidated Back:</span>
                  <strong className='text-foreground'>{fmt(totalReturned)}</strong>
                </div>
                <div className='text-muted-foreground font-bold'>=</div>
                <div>
                  <span className='text-muted-foreground block text-[11px]'>Active Market Capital:</span>
                  <strong className='text-amber-500 font-bold text-sm'>{fmt(currentActiveInvested)}</strong>
                </div>
                {netProfitRealized > 0 && (
                  <div className='bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1'>
                    <TrendingUp className='w-3.5 h-3.5' /> +{fmt(netProfitRealized)} Net Yield Extracted
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* =========================================================
              HERO FEATURE: CUMULATIVE "LEFT OVER IN HAND" LINE CHART
          ========================================================= */}
          <Card className='border shadow-sm'>
            <CardHeader className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2'>
              <div className='space-y-1'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-lg font-bold flex items-center gap-2'>
                    <TrendingUp className='w-5 h-5 text-emerald-500' />
                    {trajectoryMode === "cash"
                      ? "Cumulative Cash in Hand (Liquidity Curve)"
                      : "Total Financial Trajectory (Cash in Hand + Active Investments)"}
                  </CardTitle>
                </div>
                <CardDescription className='text-xs text-muted-foreground flex flex-wrap items-center gap-3'>
                  <span>
                    Current in Hand: <strong className='text-foreground'>{fmt(currentCashInHand)}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Peak in Hand: <strong className='text-foreground'>{fmt(peakCashInHand)}</strong> ({peakMonth})
                  </span>
                  <span>•</span>
                  <span>
                    Starting: <strong className='text-foreground'>{fmt(openingBalance)}</strong>
                  </span>
                </CardDescription>
              </div>

              {/* View Toggle */}
              <div className='flex items-center gap-1 bg-muted p-1 rounded-lg self-start md:self-auto'>
                <Button
                  variant={trajectoryMode === "cash" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => setTrajectoryMode("cash")}
                  className='h-7 text-xs px-3'
                >
                  Cash in Hand
                </Button>
                <Button
                  variant={trajectoryMode === "wealth" ? "default" : "ghost"}
                  size='sm'
                  onClick={() => setTrajectoryMode("wealth")}
                  className='h-7 text-xs px-3 gap-1.5'
                >
                  <Sparkles className='w-3 h-3 text-amber-400' />
                  Cash + Investments
                </Button>
              </div>
            </CardHeader>

            <CardContent className='px-2 pt-4 pb-2'>
              <ChartContainer className='h-[300px] w-full' config={chartConfig}>
                <ResponsiveContainer width='100%' height='100%'>
                  <ComposedChart data={monthlyRows} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id='cashInHandGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='hsl(150, 75%, 45%)' stopOpacity={0.35} />
                        <stop offset='95%' stopColor='hsl(150, 75%, 45%)' stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id='wealthGradient' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.15} />
                    <XAxis dataKey='month' />
                    <YAxis
                      tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                      domain={['auto', 'auto']}
                    />
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          labelFormatter={(label) => `Month: ${label} ${selectedYear}`}
                          formatter={(value, name) => [
                            fmt(Number(value)),
                            name === "cumCashInHand"
                              ? "Cash in Hand"
                              : name === "netWealth"
                              ? "Total Net Wealth"
                              : name === "net"
                              ? "Monthly Net Change"
                              : name,
                          ]}
                        />
                      }
                    />
                    <ReferenceLine y={0} stroke='currentColor' strokeOpacity={0.3} strokeDasharray='4 4' />

                    {/* Leftover Liquid Cash in Hand Area/Line */}
                    <Area
                      type='monotone'
                      dataKey='cumCashInHand'
                      stroke='hsl(150, 75%, 40%)'
                      strokeWidth={2.5}
                      fill='url(#cashInHandGradient)'
                      name='cumCashInHand'
                      dot={{ r: 3, fill: "hsl(150, 75%, 40%)" }}
                      activeDot={{ r: 6 }}
                    />

                    {/* Optional Total Net Wealth Line */}
                    {trajectoryMode === "wealth" && (
                      <Line
                        type='monotone'
                        dataKey='netWealth'
                        stroke='hsl(217, 91%, 60%)'
                        strokeWidth={2.5}
                        strokeDasharray='5 5'
                        dot={{ r: 3, fill: "hsl(217, 91%, 60%)" }}
                        name='netWealth'
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartContainer>

              <div className='flex flex-wrap items-center justify-between text-xs text-muted-foreground px-4 pt-2 border-t mt-2'>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center gap-1.5'>
                    <span className='w-3 h-3 rounded-full bg-emerald-500 inline-block'></span>
                    <span>Liquid Cash in Hand</span>
                  </div>
                  {trajectoryMode === "wealth" && (
                    <div className='flex items-center gap-1.5'>
                      <span className='w-3 h-0.5 border-t-2 border-dashed border-primary inline-block'></span>
                      <span>Total Net Wealth (Cash + Assets)</span>
                    </div>
                  )}
                </div>
                <div className='text-[11px] text-muted-foreground'>
                  Tip: Update your starting bank balance above to track exact real-world balances.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =========================================================
              SECONDARY SECTION: CAPITAL ALLOCATION & RATIOS
          ========================================================= */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Capital Allocation Progress Bar (50/30/20 Rule) */}
            <Card className='border shadow-sm col-span-1 lg:col-span-1'>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base font-semibold flex items-center gap-2'>
                  <PiggyBank className='w-4 h-4 text-primary' />
                  Where Did My Money Go?
                </CardTitle>
                <CardDescription className='text-xs'>
                  Annual income distribution & allocation
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 text-sm'>
                {totalIncome > 0 ? (
                  <>
                    <div className='space-y-2'>
                      {/* Stacked bar visualization */}
                      <div className='h-4 w-full rounded-full bg-muted overflow-hidden flex'>
                        <div
                          style={{ width: `${Math.min(100, Math.round((totalLivingCost / totalIncome) * 100))}%` }}
                          className='bg-rose-500 transition-all'
                          title={`Living Expenses: ${fmt(totalLivingCost)}`}
                        />
                        <div
                          style={{ width: `${Math.min(100, Math.round((totalInvested / totalIncome) * 100))}%` }}
                          className='bg-amber-500 transition-all'
                          title={`Invested: ${fmt(totalInvested)}`}
                        />
                        <div
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(100, Math.round((totalNetSavings / totalIncome) * 100)),
                            )}%`,
                          }}
                          className='bg-emerald-500 transition-all'
                          title={`Retained Cash: ${fmt(totalNetSavings)}`}
                        />
                      </div>

                      <div className='grid grid-cols-3 text-xs pt-1'>
                        <div className='text-left'>
                          <div className='flex items-center gap-1 text-muted-foreground'>
                            <span className='w-2 h-2 rounded-full bg-rose-500'></span> Living
                          </div>
                          <span className='font-semibold'>{round((totalLivingCost / totalIncome) * 100)}%</span>
                        </div>
                        <div className='text-center'>
                          <div className='flex items-center justify-center gap-1 text-muted-foreground'>
                            <span className='w-2 h-2 rounded-full bg-amber-500'></span> Invested
                          </div>
                          <span className='font-semibold'>{round((totalInvested / totalIncome) * 100)}%</span>
                        </div>
                        <div className='text-right'>
                          <div className='flex items-center justify-end gap-1 text-muted-foreground'>
                            <span className='w-2 h-2 rounded-full bg-emerald-500'></span> Saved
                          </div>
                          <span className='font-semibold'>{savingsRate}%</span>
                        </div>
                      </div>
                    </div>

                    <div className='p-3 bg-muted/40 rounded-lg space-y-2 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground'>Living Outflows:</span>
                        <strong className='text-foreground'>{fmt(totalLivingCost)}</strong>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-muted-foreground'>Invested Capital:</span>
                        <strong className='text-foreground'>{fmt(totalInvested)}</strong>
                      </div>
                      <div className='flex items-center justify-between border-t pt-1'>
                        <span className='text-muted-foreground'>Net Surplus Added:</span>
                        <strong className={totalNetSavings >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                          {fmt(totalNetSavings)}
                        </strong>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className='text-xs text-muted-foreground py-6 text-center'>
                    No income records to calculate allocation.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Monthly Net Surplus / Deficit (Waterfall Area) */}
            <Card className='border shadow-sm col-span-1 lg:col-span-2'>
              <CardHeader className='pb-2'>
                <CardTitle className='text-base font-semibold'>Monthly Cash Surplus & Deficit</CardTitle>
                <CardDescription className='text-xs'>
                  Net cash added to hand or drained per month (Income − All Outflows)
                </CardDescription>
              </CardHeader>
              <CardContent className='px-2'>
                <ChartContainer className='h-[210px] w-full' config={chartConfig}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart data={monthlyRows}>
                      <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.15} />
                      <XAxis dataKey='month' />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip
                        content={
                          <ChartTooltipContent
                            formatter={(value) => [
                              fmt(Number(value)),
                              Number(value) >= 0 ? "Net Surplus" : "Deficit",
                            ]}
                          />
                        }
                      />
                      <ReferenceLine y={0} stroke='currentColor' strokeOpacity={0.4} />
                      <Bar
                        dataKey='net'
                        name='net'
                        radius={[4, 4, 0, 0]}
                        fill='var(--chart-4)'
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* =========================================================
              MONTHLY CASHFLOW (INCOME VS EXPENSES VS INVESTED)
          ========================================================= */}
          <Card className='border shadow-sm'>
            <CardHeader className='flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3'>
              <CardTitle className='text-base font-semibold'>Monthly Cashflow Composition</CardTitle>
              <CardDescription className='text-xs'>Total Income vs Core Living Expenses vs Invested Capital</CardDescription>
            </CardHeader>
            <CardContent className='px-2'>
              <ChartContainer className='h-[260px] w-full' config={chartConfig}>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={monthlyRows} barCategoryGap='25%'>
                    <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.15} />
                    <XAxis dataKey='month' />
                    <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey='income' fill='var(--chart-2)' name='Income' radius={[4, 4, 0, 0]} />
                    <Bar dataKey='expenses' fill='var(--chart-5)' name='Core Expenses' radius={[4, 4, 0, 0]} />
                    <Bar dataKey='investmentDeployed' fill='var(--chart-3)' name='Invested' radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* =========================================================
              INCOME SOURCE BREAKDOWN
          ========================================================= */}
          {incomeData?.sources?.length > 0 && (
            <Card className='border shadow-sm'>
              <CardHeader className='flex flex-1 flex-col justify-center gap-1 px-6 pt-4 pb-3'>
                <CardTitle className='text-base font-semibold'>Income Sources Breakdown</CardTitle>
                <CardDescription className='text-xs'>Monthly earnings grouped by source</CardDescription>
              </CardHeader>
              <CardContent className='px-2'>
                <ChartContainer className='h-[240px] w-full' config={chartConfig}>
                  <ResponsiveContainer width='100%' height='100%'>
                    <BarChart
                      data={incomeData.months.map((m: any) => ({
                        month: MONTH_ABBR[MONTHS_FULL.indexOf(m.month)],
                        ...Object.fromEntries(
                          m.data
                            .filter((d: any) => d.source !== "Total")
                            .map((d: any) => [d.source, d.amount]),
                        ),
                      }))}
                    >
                      <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.15} />
                      <XAxis dataKey='month' />
                      <YAxis tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      {incomeData.sources.map((src: string, i: number) => (
                        <Bar
                          key={src}
                          dataKey={src}
                          stackId='income'
                          fill={`hsl(${(i * 137.5) % 360}, 65%, 55%)`}
                          name={src}
                          radius={i === incomeData.sources.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <div className='flex justify-center py-24 text-muted-foreground'>
          No income or expense data available for {selectedYear}.
        </div>
      )}
    </div>
  );
};
