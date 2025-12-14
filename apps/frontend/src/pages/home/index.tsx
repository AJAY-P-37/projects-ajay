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
    description: "Track your expenses month by month",
    path: "/projects/expenses/monthlyTracker",
  },
  {
    title: "3. Visualize",
    description: "Analyze expenses with charts and insights",
    path: "/projects/expenses/visualize",
  },
];

export function Home() {
  return (
    <Card className='m-6 p-6'>
      <CardTitle className='text-2xl font-semibold mb-6'>Expense Management</CardTitle>

      <CardContent className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
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
