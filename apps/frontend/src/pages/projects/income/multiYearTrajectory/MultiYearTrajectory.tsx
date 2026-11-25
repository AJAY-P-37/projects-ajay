import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useUserSettings } from "@/hooks/useUserSettings";
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
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Landmark,
  PiggyBank,
  ShieldCheck,
  Calendar,
  Sparkles,
  Pencil,
  Check,
  Coins,
  ArrowUpRight,
  Receipt,
  Settings,
} from "lucide-react";


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

export const MultiYearTrajectory = () => {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const { startYear: START_YEAR, initialBalance, isLoading: isSettingsLoading } = useUserSettings();

  // Array of years from user's start year to current year
  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = START_YEAR; y <= Math.max(currentYear, START_YEAR); y++) {
      list.push(y);
    }
    return list;
  }, [currentYear, START_YEAR]);

  // Balance editing (inline edit still works, but initial value comes from settings)
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [tempBalanceInput, setTempBalanceInput] = useState(String(initialBalance));

  const handleSaveInitialBalance = () => {
    // Balance is now managed via /profile/settings — inline edit is view-only feedback
    setIsEditingBalance(false);
  };

  // View toggles
  const [metricMode, setMetricMode] = useState<"cash" | "wealth" | "both">("both");
  const [timelineResolution, setTimelineResolution] = useState<"monthly" | "yearly">("monthly");

  // Fetch all years data in parallel
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["multi-year-financial-trajectory", START_YEAR, currentYear],
    queryFn: async () => {
      const incomeService = new IncomeService();
      const expensesService = new ExpensesService();

      const [incomeResults, expenseResults] = await Promise.all([
        Promise.all(years.map((y) => incomeService.getMonthlyConsolidatedPivotTable(y))),
        Promise.all(years.map((y) => expensesService.getMonthlyConsolidatedPivotTable(y))),
      ]);

      return { incomeResults, expenseResults };
    },
    refetchOnWindowFocus: false,
    retry: false,
  });

  // Process data into continuous chronological timeline
  const processed = useMemo(() => {
    if (!rawData) return null;

    interface TimelinePoint {
      label: string;
      year: number;
      month: string;
      monthIdx: number;
      income: number;
      earnedIncome: number;
      expenses: number;
      insurance: number;
      investmentDeployed: number;
      investmentReturned: number;
      totalOutflows: number;
      monthlyNet: number;
      cumCashInHand: number;
      cumInvested: number;
      netWealth: number;
      hasData: boolean;
    }

    let runningCash = initialBalance;
    let runningNetDeployed = 0;
    const allMonthlyPoints: TimelinePoint[] = [];

    // Process each year and month
    years.forEach((yr, yrIdx) => {
      const incData = rawData.incomeResults[yrIdx];
      const expData = rawData.expenseResults[yrIdx];

      MONTHS_FULL.forEach((m, mIdx) => {
        const incMonth = incData?.months?.find((x: any) => x.month === m);
        const expMonth = expData?.months?.find((x: any) => x.month === m);

        const totalGrossIncome = incMonth?.data?.find((d: any) => d.source === "Total")?.amount ?? 0;
        const investmentReturned =
          incMonth?.data?.find((d: any) => d.source === "Investment Return")?.amount ?? 0;
        const earnedIncome = round(Math.max(0, totalGrossIncome - investmentReturned));

        const totalGrossExpense = expMonth?.data?.find((d: any) => d.category === "Total")?.amount ?? 0;
        const investmentDeployed =
          expMonth?.data?.find((d: any) => d.category === "Investment")?.amount ?? 0;
        const insurance = expMonth?.data?.find((d: any) => d.category === "Insurance")?.amount ?? 0;
        const coreExpenses = round(Math.max(0, totalGrossExpense - investmentDeployed - insurance));
        const livingExpenses = round(coreExpenses + insurance);

        // Actual cash entering and leaving the bank account
        const totalOutflows = round(livingExpenses + investmentDeployed);
        const monthlyNet = round(totalGrossIncome - totalOutflows);

        // Bank balance progression
        runningCash = round(runningCash + monthlyNet);

        // Consolidated Active Portfolio: money currently still parked in investments (never negative)
        runningNetDeployed = round(runningNetDeployed + investmentDeployed - investmentReturned);
        const activePortfolio = Math.max(0, runningNetDeployed);

        // Net Wealth = Bank Cash + Active Portfolio (No double counting)
        const netWealth = round(runningCash + activePortfolio);

        const hasData = totalGrossIncome > 0 || totalGrossExpense > 0;

        allMonthlyPoints.push({
          label: `${MONTH_ABBR[mIdx]} '${String(yr).slice(2)}`,
          year: yr,
          month: m,
          monthIdx: mIdx,
          income: round(totalGrossIncome),
          earnedIncome,
          expenses: round(coreExpenses),
          insurance: round(insurance),
          investmentDeployed: round(investmentDeployed),
          investmentReturned: round(investmentReturned),
          totalOutflows,
          monthlyNet,
          cumCashInHand: runningCash,
          cumInvested: activePortfolio,
          netWealth,
          hasData,
        });
      });
    });

    // Truncate future months with no data so the line ends at the current active month
    const lastActiveIdx = allMonthlyPoints.map((p) => p.hasData).lastIndexOf(true);
    const activeMonthlyTimeline =
      lastActiveIdx >= 0 ? allMonthlyPoints.slice(0, lastActiveIdx + 1) : allMonthlyPoints;

    // Yearly Aggregates
    interface YearlySummary {
      year: number;
      totalIncome: number;
      earnedIncome: number;
      totalLiving: number;
      totalInvested: number;
      totalReturned: number;
      netCashAdded: number;
      closingCashInHand: number;
      closingNetWealth: number;
      closingActiveInvested: number;
      savingsRate: number;
    }

    const yearlySummaries: YearlySummary[] = years.map((yr) => {
      const yearPoints = allMonthlyPoints.filter((p) => p.year === yr);
      const yrGrossIncome = round(yearPoints.reduce((s, p) => s + p.income, 0));
      const yrReturned = round(yearPoints.reduce((s, p) => s + p.investmentReturned, 0));
      const yrEarnedIncome = round(Math.max(0, yrGrossIncome - yrReturned));
      const yrLiving = round(yearPoints.reduce((s, p) => s + p.expenses + p.insurance, 0));
      const yrInvested = round(yearPoints.reduce((s, p) => s + p.investmentDeployed, 0));
      const yrNet = round(yrGrossIncome - yrLiving - yrInvested);
      const lastPointInYear =
        yearPoints.filter((p) => p.hasData).pop() ?? yearPoints[yearPoints.length - 1];

      return {
        year: yr,
        totalIncome: yrGrossIncome,
        earnedIncome: yrEarnedIncome,
        totalLiving: yrLiving,
        totalInvested: yrInvested,
        totalReturned: yrReturned,
        netCashAdded: yrNet,
        closingCashInHand: lastPointInYear?.cumCashInHand ?? 0,
        closingNetWealth: lastPointInYear?.netWealth ?? 0,
        closingActiveInvested: lastPointInYear?.cumInvested ?? 0,
        savingsRate: yrEarnedIncome > 0 ? round(((yrEarnedIncome - yrLiving) / yrEarnedIncome) * 100) : 0,
      };
    });

    // Overall Multi-Year Totals
    const grandGrossIncome = round(allMonthlyPoints.reduce((s, p) => s + p.income, 0));
    const grandReturned = round(allMonthlyPoints.reduce((s, p) => s + p.investmentReturned, 0));
    const grandEarnedIncome = round(Math.max(0, grandGrossIncome - grandReturned));
    const grandLiving = round(allMonthlyPoints.reduce((s, p) => s + p.expenses + p.insurance, 0));
    const grandInvested = round(allMonthlyPoints.reduce((s, p) => s + p.investmentDeployed, 0));
    const latestPoint = activeMonthlyTimeline[activeMonthlyTimeline.length - 1];

    const currentCashInHand = latestPoint?.cumCashInHand ?? initialBalance;
    const currentActiveInvested = latestPoint?.cumInvested ?? 0;
    const currentNetWealth = latestPoint?.netWealth ?? initialBalance;
    const peakCashInHand = Math.max(...activeMonthlyTimeline.map((p) => p.cumCashInHand), initialBalance);
    const peakPoint = activeMonthlyTimeline.find((p) => p.cumCashInHand === peakCashInHand);

    const totalCashGrowth = round(currentCashInHand - initialBalance);
    const totalWealthGrowth = round(currentNetWealth - initialBalance);

    // Net capital position across entire period
    const netCapitalDeployed = round(grandInvested - grandReturned);
    const netProfitRealized = Math.max(0, round(grandReturned - grandInvested));

    return {
      activeMonthlyTimeline,
      yearlySummaries,
      grandGrossIncome,
      grandEarnedIncome,
      grandLiving,
      grandInvested,
      grandReturned,
      netCapitalDeployed,
      netProfitRealized,
      currentCashInHand,
      currentActiveInvested,
      currentNetWealth,
      peakCashInHand,
      peakPoint,
      totalCashGrowth,
      totalWealthGrowth,
    };
  }, [rawData, years, initialBalance]);

  if (isLoading || isSettingsLoading) return <Loader />;
  if (!processed) return null;

  const chartConfig: ChartConfig = {
    cumCashInHand: { label: "Cash in Hand", color: "hsl(150, 75%, 40%)" },
    netWealth: { label: "Total Net Wealth", color: "hsl(217, 91%, 60%)" },
    totalIncome: { label: "Income", color: "var(--chart-2)" },
    totalLiving: { label: "Living Expenses", color: "var(--chart-5)" },
    totalInvested: { label: "Invested", color: "var(--chart-3)" },
    netCashAdded: { label: "Net Cash Surplus", color: "var(--chart-4)" },
  };

  return (
    <div className='space-y-8 mx-3 my-6'>
      {/* =========================================================
          PAGE HEADER & INITIAL BALANCE CONTROLS
      ========================================================= */}
      <Card className='border-0 shadow-sm'>
        <CardHeader className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between pb-4'>
          <div>
            <CardTitle className='text-2xl font-bold flex items-center gap-2'>
              <TrendingUp className='w-6 h-6 text-emerald-500' />
              Multi-Year Financial Trajectory
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Continuous financial curve and wealth trajectory from January {START_YEAR} to present.
            </CardDescription>
          </div>

          <div className='flex flex-wrap items-center gap-3 self-start md:self-auto'>
            {/* Initial Jan 2021 Balance Control */}
            <div className='flex items-center gap-2 bg-muted/60 px-3 py-1.5 rounded-lg border text-xs'>
              <Landmark className='w-4 h-4 text-primary' />
              <span className='font-medium text-muted-foreground'>Starting Balance (Jan {START_YEAR}):</span>
              {isEditingBalance ? (
                <div className='flex items-center gap-1.5'>
                  <Input
                    type='number'
                    value={tempBalanceInput}
                    onChange={(e) => setTempBalanceInput(e.target.value)}
                    className='h-7 w-28 text-xs py-0 px-2 font-semibold'
                    autoFocus
                  />
                  <Button size='sm' className='h-7 px-2 text-xs' onClick={handleSaveInitialBalance}>
                    <Check className='w-3.5 h-3.5 mr-1' /> Set
                  </Button>
                </div>
              ) : (
                <div className='flex items-center gap-1.5'>
                  <strong className='text-foreground'>{fmt(initialBalance)}</strong>
                  <button
                    onClick={() => setIsEditingBalance(true)}
                    className='text-muted-foreground hover:text-foreground transition p-0.5'
                    title='Edit starting balance on Jan 2021'
                  >
                    <Pencil className='w-3 h-3' />
                  </button>
                </div>
              )}
            </div>

            <div className='inline-flex items-center rounded-md border px-2.5 py-1 text-xs gap-1.5 font-medium text-foreground bg-background'>
              <Calendar className='w-3.5 h-3.5 text-primary' />
              {START_YEAR} – {currentYear}
            </div>

            <Button
              variant='outline'
              size='sm'
              className='h-7 px-2.5 text-xs gap-1.5'
              onClick={() => navigate('/projects/profile/settings')}
              title='Configure start year and initial balance'
            >
              <Settings className='w-3.5 h-3.5' />
              Settings
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* =========================================================
          KEY MULTI-YEAR KPIS
      ========================================================= */}
      <div className='grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
        {/* 1. Current Cash in Hand */}
        <Card className='border border-emerald-500/30 bg-emerald-500/5 shadow-xs'>
          <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>Current in Hand</span>
              <Wallet className='w-4 h-4 text-emerald-500' />
            </div>
            <div className='text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400'>
              {fmt(processed.currentCashInHand)}
            </div>
            <div className='text-[11px] text-muted-foreground truncate'>
              {processed.totalCashGrowth >= 0 ? (
                <span className='text-emerald-600 font-medium flex items-center gap-0.5 whitespace-nowrap'>
                  <TrendingUp className='w-3 h-3' /> +{fmt(processed.totalCashGrowth)} since Jan {START_YEAR}
                </span>
              ) : (
                <span className='text-rose-500 font-medium flex items-center gap-0.5 whitespace-nowrap'>
                  <TrendingDown className='w-3 h-3' /> -{fmt(Math.abs(processed.totalCashGrowth))} since Jan {START_YEAR}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 2. Total Net Wealth */}
        <Card className='border border-primary/20 bg-primary/5 shadow-xs'>
          <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>Total Net Wealth</span>
              <PiggyBank className='w-4 h-4 text-primary' />
            </div>
            <div className='text-2xl font-bold tracking-tight text-foreground'>
              {fmt(processed.currentNetWealth)}
            </div>
            <div className='text-[11px] text-muted-foreground truncate' title={`Cash: ${fmt(processed.currentCashInHand)} | Assets: ${fmt(processed.currentActiveInvested)}`}>
              Cash ({fmt(processed.currentCashInHand)}) + Assets ({fmt(processed.currentActiveInvested)})
            </div>
          </CardContent>
        </Card>

        {/* 3. Wealth Created */}
        <Card className='border shadow-xs'>
          <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>Wealth Created</span>
              <ArrowUpRight className='w-4 h-4 text-emerald-500' />
            </div>
            <div className='text-2xl font-bold tracking-tight text-foreground'>
              +{fmt(processed.totalWealthGrowth)}
            </div>
            <div className='text-[11px] text-muted-foreground truncate'>
              Above starting {fmt(initialBalance)}
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
              {fmt(processed.grandEarnedIncome)}
            </div>
            <div className='text-[11px] text-muted-foreground truncate'>
              {processed.grandReturned > 0 ? (
                <span className='text-emerald-600 font-medium'>+{fmt(processed.grandReturned)} returned</span>
              ) : (
                <span>Wages & business earnings</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 5. Total Living Outflows */}
        <Card className='border shadow-xs'>
          <CardContent className='p-4 space-y-1 flex flex-col justify-between h-[106px]'>
            <div className='flex items-center justify-between text-xs text-muted-foreground'>
              <span>Living Expenses</span>
              <Receipt className='w-4 h-4 text-rose-500/70' />
            </div>
            <div className='text-2xl font-bold tracking-tight text-foreground'>
              {fmt(processed.grandLiving)}
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
              {fmt(processed.currentActiveInvested)}
            </div>
            <div className='text-[11px] text-muted-foreground truncate' title={`Gross Deployed: ${fmt(processed.grandInvested)} | Returned: ${fmt(processed.grandReturned)}`}>
              Deployed: {fmt(processed.grandInvested)} | Returned: {fmt(processed.grandReturned)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* =========================================================
          INVESTMENT CONSOLIDATION & FLOW PANEL
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
                Depositing cash into investments converts cash to assets. Liquidating investments moves assets back into cash.
              </div>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4 text-xs'>
            <div>
              <span className='text-muted-foreground block text-[11px]'>Gross Deployed:</span>
              <strong className='text-foreground'>{fmt(processed.grandInvested)}</strong>
            </div>
            <div className='text-muted-foreground font-bold'>−</div>
            <div>
              <span className='text-muted-foreground block text-[11px]'>Liquidated Back:</span>
              <strong className='text-foreground'>{fmt(processed.grandReturned)}</strong>
            </div>
            <div className='text-muted-foreground font-bold'>=</div>
            <div>
              <span className='text-muted-foreground block text-[11px]'>Active Market Capital:</span>
              <strong className='text-amber-500 font-bold text-sm'>{fmt(processed.currentActiveInvested)}</strong>
            </div>
            {processed.netProfitRealized > 0 && (
              <div className='bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-md text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1'>
                <TrendingUp className='w-3.5 h-3.5' /> +{fmt(processed.netProfitRealized)} Net Yield Extracted
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* =========================================================
          HERO MULTI-YEAR TRAJECTORY CHART
      ========================================================= */}
      <Card className='border shadow-sm'>
        <CardHeader className='flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2'>
          <div className='space-y-1'>
            <CardTitle className='text-lg font-bold flex items-center gap-2'>
              <TrendingUp className='w-5 h-5 text-emerald-500' />
              {timelineResolution === "monthly"
                ? `Continuous Financial Trajectory (${START_YEAR} – Present)`
                : `Annual Wealth Milestones (${START_YEAR} – ${currentYear})`}
            </CardTitle>
            <CardDescription className='text-xs text-muted-foreground flex flex-wrap items-center gap-3'>
              <span>
                Starting: <strong className='text-foreground'>{fmt(initialBalance)}</strong> (Jan {START_YEAR})
              </span>
              <span>•</span>
              <span>
                Peak in Hand: <strong className='text-foreground'>{fmt(processed.peakCashInHand)}</strong>{" "}
                ({processed.peakPoint?.label})
              </span>
              <span>•</span>
              <span>
                Latest: <strong className='text-foreground'>{fmt(processed.currentCashInHand)}</strong>
              </span>
            </CardDescription>
          </div>

          <div className='flex flex-wrap items-center gap-2 self-start md:self-auto'>
            {/* Resolution Switcher */}
            <div className='flex items-center gap-1 bg-muted p-1 rounded-lg'>
              <Button
                variant={timelineResolution === "monthly" ? "default" : "ghost"}
                size='sm'
                onClick={() => setTimelineResolution("monthly")}
                className='h-7 text-xs px-2.5'
              >
                Monthly
              </Button>
              <Button
                variant={timelineResolution === "yearly" ? "default" : "ghost"}
                size='sm'
                onClick={() => setTimelineResolution("yearly")}
                className='h-7 text-xs px-2.5'
              >
                Yearly
              </Button>
            </div>

            {/* Metric Mode Switcher */}
            <div className='flex items-center gap-1 bg-muted p-1 rounded-lg'>
              <Button
                variant={metricMode === "cash" ? "default" : "ghost"}
                size='sm'
                onClick={() => setMetricMode("cash")}
                className='h-7 text-xs px-2.5'
              >
                Cash in Hand
              </Button>
              <Button
                variant={metricMode === "wealth" ? "default" : "ghost"}
                size='sm'
                onClick={() => setMetricMode("wealth")}
                className='h-7 text-xs px-2.5'
              >
                Net Wealth
              </Button>
              <Button
                variant={metricMode === "both" ? "default" : "ghost"}
                size='sm'
                onClick={() => setMetricMode("both")}
                className='h-7 text-xs px-2.5 gap-1'
              >
                <Sparkles className='w-3 h-3 text-amber-400' /> Both
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className='px-2 pt-4 pb-2'>
          <ChartContainer className='h-[340px] w-full' config={chartConfig}>
            <ResponsiveContainer width='100%' height='100%'>
              {timelineResolution === "monthly" ? (
                <ComposedChart
                  data={processed.activeMonthlyTimeline}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id='multiYearCashGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='hsl(150, 75%, 45%)' stopOpacity={0.35} />
                      <stop offset='95%' stopColor='hsl(150, 75%, 45%)' stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id='multiYearWealthGradient' x1='0' y1='0' x2='0' y2='1'>
                      <stop offset='5%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.25} />
                      <stop offset='95%' stopColor='hsl(217, 91%, 60%)' stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.15} />
                  <XAxis dataKey='label' interval='preserveStartEnd' />
                  <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} domain={['auto', 'auto']} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        labelFormatter={(label) => `Timeline: ${label}`}
                        formatter={(value, name) => [
                          fmt(Number(value)),
                          name === "cumCashInHand"
                            ? "Cash in Hand"
                            : name === "netWealth"
                              ? "Total Net Wealth"
                              : name,
                        ]}
                      />
                    }
                  />
                  <ReferenceLine y={initialBalance} stroke='currentColor' strokeDasharray='3 3' strokeOpacity={0.3} label={{ value: `Start: ${fmt(initialBalance)}`, position: 'insideTopLeft', fontSize: 10 }} />

                  {(metricMode === "cash" || metricMode === "both") && (
                    <Area
                      type='monotone'
                      dataKey='cumCashInHand'
                      stroke='hsl(150, 75%, 40%)'
                      strokeWidth={2.5}
                      fill='url(#multiYearCashGradient)'
                      name='cumCashInHand'
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  )}

                  {(metricMode === "wealth" || metricMode === "both") && (
                    <Line
                      type='monotone'
                      dataKey='netWealth'
                      stroke='hsl(217, 91%, 60%)'
                      strokeWidth={2.5}
                      strokeDasharray={metricMode === "both" ? "4 4" : undefined}
                      dot={false}
                      activeDot={{ r: 5 }}
                      name='netWealth'
                    />
                  )}
                </ComposedChart>
              ) : (
                <BarChart data={processed.yearlySummaries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray='3 3' strokeOpacity={0.15} />
                  <XAxis dataKey='year' />
                  <YAxis tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value, name) => [
                          fmt(Number(value)),
                          name === "closingCashInHand"
                            ? "Year-End Cash in Hand"
                            : name === "closingNetWealth"
                              ? "Year-End Net Wealth"
                              : name,
                        ]}
                      />
                    }
                  />
                  <Bar
                    dataKey='closingCashInHand'
                    fill='hsl(150, 75%, 40%)'
                    name='closingCashInHand'
                    radius={[4, 4, 0, 0]}
                  />
                  {(metricMode === "wealth" || metricMode === "both") && (
                    <Bar
                      dataKey='closingNetWealth'
                      fill='hsl(217, 91%, 60%)'
                      name='closingNetWealth'
                      radius={[4, 4, 0, 0]}
                    />
                  )}
                </BarChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>

          <div className='flex flex-wrap items-center justify-between text-xs text-muted-foreground px-4 pt-2 border-t mt-2'>
            <div className='flex items-center gap-4'>
              {(metricMode === "cash" || metricMode === "both") && (
                <div className='flex items-center gap-1.5'>
                  <span className='w-3 h-3 rounded-full bg-emerald-500 inline-block'></span>
                  <span>Liquid Cash in Hand (Starting from {fmt(initialBalance)})</span>
                </div>
              )}
              {(metricMode === "wealth" || metricMode === "both") && (
                <div className='flex items-center gap-1.5'>
                  <span className='w-3 h-0.5 border-t-2 border-dashed border-primary inline-block'></span>
                  <span>Total Net Wealth (Cash + Active Assets)</span>
                </div>
              )}
            </div>
            <div className='text-[11px] text-muted-foreground'>
              Tracks continuous leftover cash from Jan 2021 through today.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* =========================================================
          YEAR-OVER-YEAR COMPARISON & MILESTONE TABLE
      ========================================================= */}
      <Card className='border shadow-sm'>
        <CardHeader className='pb-3'>
          <CardTitle className='text-base font-semibold flex items-center gap-2'>
            <Calendar className='w-4 h-4 text-primary' />
            Year-over-Year (YoY) Financial Milestones
          </CardTitle>
          <CardDescription className='text-xs'>
            Annual totals, capital deployed, and year-end closing balances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <table className='w-full text-xs text-left border-collapse'>
              <thead>
                <tr className='border-b bg-muted/40 text-muted-foreground'>
                  <th className='py-2.5 px-3 font-semibold'>Year</th>
                  <th className='py-2.5 px-3 font-semibold'>Earned Income</th>
                  <th className='py-2.5 px-3 font-semibold'>Capital Returned</th>
                  <th className='py-2.5 px-3 font-semibold'>Living Expenses</th>
                  <th className='py-2.5 px-3 font-semibold'>Deployed (Gross)</th>
                  <th className='py-2.5 px-3 font-semibold'>Active Portfolio</th>
                  <th className='py-2.5 px-3 font-semibold'>Net Cash Surplus</th>
                  <th className='py-2.5 px-3 font-semibold'>Savings Rate</th>
                  <th className='py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400'>
                    Closing Cash in Hand
                  </th>
                  <th className='py-2.5 px-3 font-semibold text-primary'>Closing Net Wealth</th>
                </tr>
              </thead>
              <tbody>
                {processed.yearlySummaries.map((s) => (
                  <tr key={s.year} className='border-b hover:bg-muted/20 transition-colors'>
                    <td className='py-2.5 px-3 font-bold text-foreground'>{s.year}</td>
                    <td className='py-2.5 px-3 text-emerald-600 font-medium'>{fmt(s.earnedIncome)}</td>
                    <td className='py-2.5 px-3 text-muted-foreground'>{s.totalReturned > 0 ? fmt(s.totalReturned) : "—"}</td>
                    <td className='py-2.5 px-3 text-rose-500 font-medium'>{fmt(s.totalLiving)}</td>
                    <td className='py-2.5 px-3 text-amber-500 font-medium'>{fmt(s.totalInvested)}</td>
                    <td className='py-2.5 px-3 font-semibold text-amber-600 dark:text-amber-400'>{fmt(s.closingActiveInvested)}</td>
                    <td className='py-2.5 px-3'>
                      <span className={s.netCashAdded >= 0 ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>
                        {s.netCashAdded >= 0 ? `+${fmt(s.netCashAdded)}` : `-${fmt(Math.abs(s.netCashAdded))}`}
                      </span>
                    </td>
                    <td className='py-2.5 px-3 font-medium'>{s.savingsRate}%</td>
                    <td className='py-2.5 px-3 font-bold text-emerald-600 dark:text-emerald-400'>
                      {fmt(s.closingCashInHand)}
                    </td>
                    <td className='py-2.5 px-3 font-bold text-foreground'>{fmt(s.closingNetWealth)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
