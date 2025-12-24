import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";
import { Badge } from "shadcn-lib/dist/components/ui/badge";
import { clsx as cn } from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: string;
  subText?: string;
  trend?: "up" | "down";
  icon?: React.ReactNode;
};

export function KpiCard({ label, value, subText, trend, icon }: KpiCardProps) {
  return (
    <Card className='border-muted/50'>
      <CardContent className='px-4 space-y-1 flex flex-col items-center justify-center'>
        <div className='flex items-center justify-between text-sm text-muted-foreground'>
          <span>{label}</span>
          {icon}
        </div>

        <div className='text-2xl font-semibold tracking-tight'>{value}</div>

        {subText && (
          <p
            className={cn(
              "text-xs",
              trend === "up" && "text-emerald-500",
              trend === "down" && "text-rose-500",
              !trend && "text-muted-foreground",
            )}
          >
            {subText}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// // import { TrendingDown, TrendingUp } from "@tabler/icons-react"

// export function SectionCards() {
//   return (
//     <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4'>
//       <Card className='@container/card'>
//         <CardHeader>
//           <CardDescription>Total Revenue</CardDescription>
//           <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
//             $1,250.00
//           </CardTitle>
//           <CardAction>
//             <Badge variant='outline'>
//               <TrendingUp />
//               +12.5%
//             </Badge>
//           </CardAction>
//         </CardHeader>
//         <CardFooter className='flex-col items-start gap-1.5 text-sm'>
//           <div className='line-clamp-1 flex gap-2 font-medium'>
//             Trending up this month <TrendingUp className='size-4' />
//           </div>
//           <div className='text-muted-foreground'>Visitors for the last 6 months</div>
//         </CardFooter>
//       </Card>
//       <Card className='@container/card'>
//         <CardHeader>
//           <CardDescription>New Customers</CardDescription>
//           <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
//             1,234
//           </CardTitle>
//           <CardAction>
//             <Badge variant='outline'>
//               <TrendingDown />
//               -20%
//             </Badge>
//           </CardAction>
//         </CardHeader>
//         <CardFooter className='flex-col items-start gap-1.5 text-sm'>
//           <div className='line-clamp-1 flex gap-2 font-medium'>
//             Down 20% this period <TrendingDown className='size-4' />
//           </div>
//           <div className='text-muted-foreground'>Acquisition needs attention</div>
//         </CardFooter>
//       </Card>
//       <Card className='@container/card'>
//         <CardHeader>
//           <CardDescription>Active Accounts</CardDescription>
//           <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
//             45,678
//           </CardTitle>
//           <CardAction>
//             <Badge variant='outline'>
//               <TrendingUp />
//               +12.5%
//             </Badge>
//           </CardAction>
//         </CardHeader>
//         <CardFooter className='flex-col items-start gap-1.5 text-sm'>
//           <div className='line-clamp-1 flex gap-2 font-medium'>
//             Strong user retention <TrendingUp className='size-4' />
//           </div>
//           <div className='text-muted-foreground'>Engagement exceed targets</div>
//         </CardFooter>
//       </Card>
//       <Card className='@container/card'>
//         <CardHeader>
//           <CardDescription>Growth Rate</CardDescription>
//           <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
//             4.5%
//           </CardTitle>
//           <CardAction>
//             <Badge variant='outline'>
//               <TrendingUp />
//               +4.5%
//             </Badge>
//           </CardAction>
//         </CardHeader>
//         <CardFooter className='flex-col items-start gap-1.5 text-sm'>
//           <div className='line-clamp-1 flex gap-2 font-medium'>
//             Steady performance increase <TrendingUp className='size-4' />
//           </div>
//           <div className='text-muted-foreground'>Meets growth projections</div>
//         </CardFooter>
//       </Card>
//     </div>
//   );
// }
