import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "shadcn-lib/dist/components/ui/select";

/** @deprecated Use useUserSettings().startYear instead */
export const EARLIEST_YEAR = 2021;
export const CURRENT_YEAR = new Date().getFullYear();

export function allYears(startYear: number = EARLIEST_YEAR): number[] {
  const list: number[] = [];
  for (let y = startYear; y <= CURRENT_YEAR; y++) list.push(y);
  return list;
}

export const fmtCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const BASE_YEAR_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

/**
 * Dynamically provides distinct colors for any number of years.
 * Uses themed CSS vars for the first 5 years, and Golden Angle HSL colors beyond 5.
 */
export function getYearColor(index: number): string {
  if (index < BASE_YEAR_COLORS.length) {
    return BASE_YEAR_COLORS[index];
  }
  const GOLDEN_ANGLE = 137.508;
  const hue = Math.round((index * GOLDEN_ANGLE) % 360);
  const saturation = index % 2 === 0 ? 70 : 80;
  const lightness = index % 3 === 0 ? 52 : 60;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// Backward-compatible Proxy array so index access YEAR_COLORS[i] works for any length
export const YEAR_COLORS = new Proxy(BASE_YEAR_COLORS, {
  get(target, prop) {
    if (typeof prop === "symbol") {
      return Reflect.get(target, prop);
    }
    const idx = Number(prop);
    if (!isNaN(idx)) {
      return getYearColor(idx);
    }
    return Reflect.get(target, prop);
  },
});

interface YearRangeSelectProps {
  startYear: number;
  setStartYear: (y: number) => void;
  endYear: number;
  setEndYear: (y: number) => void;
  fullYearList: number[];
}

export const YearRangeSelect = ({
  startYear,
  setStartYear,
  endYear,
  setEndYear,
  fullYearList,
}: YearRangeSelectProps) => {
  const startYearOptions = fullYearList.filter((y) => y <= endYear);
  const endYearOptions = fullYearList.filter((y) => y >= startYear);

  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='text-muted-foreground whitespace-nowrap'>From</span>

      <Select
        value={String(startYear)}
        onValueChange={(v) => {
          const y = Number(v);
          setStartYear(y);
          if (y > endYear) setEndYear(y);
        }}
      >
        <SelectTrigger className='w-24'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {startYearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <span className='text-muted-foreground whitespace-nowrap'>to</span>

      <Select
        value={String(endYear)}
        onValueChange={(v) => {
          const y = Number(v);
          setEndYear(y);
          if (y < startYear) setStartYear(y);
        }}
      >
        <SelectTrigger className='w-24'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {endYearOptions.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
