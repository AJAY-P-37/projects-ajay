import { MainContainer } from "@/components/common/main/MainContainer";
import { LoginOrSignupForm } from "@/pages/Auth/LoginOrSignup";
import { createBrowserRouter, RouteObject } from "react-router-dom";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { Projects } from "@/pages/projects";
import { Home } from "@/pages/home";
import { Error } from "@/pages/error";
import { MonthlyExpenses } from "@/pages/projects/expenses/monthlyTracker/MonthlyExpenses";
import { AddCategories } from "@/pages/projects/expenses/addCategories/CategorizeExpenses";
import { ExpenseInsights } from "@/pages/projects/expenses/visualize/ExpenseInsights";
import { UpdateExpenses } from "@/pages/projects/expenses/updateExpenses/UpdateExpenses";
import { ExportImportExpenses } from "@/pages/projects/expenses/exportImport/ExportImportExpenses";
// import { WishPage } from "@/pages/wish";
import { AddIncomeSources } from "@/pages/projects/income/addSources/AddIncomeSources";
import { UpdateIncome } from "@/pages/projects/income/updateIncome/UpdateIncome";
import { FinancialInsights } from "@/pages/projects/income/incomeInsights/FinancialInsights";
import { ExportImportIncome } from "@/pages/projects/income/exportImport/ExportImportIncome";
import { MultiYearTrajectory } from "@/pages/projects/income/multiYearTrajectory/MultiYearTrajectory";
import { UserSettings } from "@/pages/profile/settings/UserSettings";

const Routes: RouteObject[] = [
  {
    path: "/",
    Component: MainContainer,
    children: [
      { index: true, Component: Home },
      {
        path: "/auth",
        Component: LoginOrSignupForm,
      },
      {
        path: "projects",
        Component: ProtectedRoutes,
        children: [
          { index: true, Component: Projects },
          { path: "expenses/monthlyTracker", Component: MonthlyExpenses },
          { path: "expenses/addCategories", Component: AddCategories },
          { path: "expenses/expenseInsights", Component: ExpenseInsights },
          { path: "expenses/updateExpense", Component: UpdateExpenses },
          { path: "expenses/exportImport", Component: ExportImportExpenses },
          { path: "income/addSources", Component: AddIncomeSources },
          { path: "income/updateIncome", Component: UpdateIncome },
          { path: "income/financialInsights", Component: FinancialInsights },
          { path: "income/multiYearTrajectory", Component: MultiYearTrajectory },
          { path: "income/exportImport", Component: ExportImportIncome },
          { path: "profile/settings", Component: UserSettings },
        ],
      },
    ],
    errorElement: Error(),
  },
  // {
  //   path: "BirthdayWishesMyLove",
  //   Component: WishPage,
  // },
];

export const ROUTER = createBrowserRouter(Routes);
