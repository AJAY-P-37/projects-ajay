import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "shadcn-lib/dist/components/ui/card";

const cards = [
  {
    title: "1. Add Categories",
    description: "Create and manage expense categories",
    path: "/projects/expenses/addCategories",
  },
  {
    title: "2. Monthly Tracker",
    description: "Track expense month by month",
    path: "/projects/expenses/monthlyTracker",
  },
  {
    title: "3. Visualize Expense",
    description: "Analyze expense with charts and insights",
    path: "/projects/expenses/expenseInsights",
  },
  {
    title: "3. Update Expense",
    description: "Add or Update existing expense if you missed any",
    path: "/projects/expenses/updateExpense",
  },
];

export function Home() {
  return (
    <Card className='m-6 p-6'>
      <CardTitle className='text-2xl font-semibold mb-6'>Expense Tracking</CardTitle>

      <CardContent className='grid gap-6 grid-cols-2'>
        {cards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            className='group rounded-xl border p-6 shadow-sm transition
                       hover:shadow-md hover:border-gray-300'
          >
            <CardTitle className='text-lg mb-2 group-hover:underline'>{card.title}</CardTitle>
            <CardDescription className='text-sm'>{card.description}</CardDescription>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
