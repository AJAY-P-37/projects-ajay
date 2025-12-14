import { MainContainer } from "@/components/common/main/MainContainer";
import { LoginOrSignupForm } from "@/pages/auth/LoginOrSignup";
import { createBrowserRouter, RouteObject } from "react-router-dom";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { Projects } from "@/pages/projects";
import { Home } from "@/pages/home";
import { Error } from "@/pages/error";
import { Expenses } from "@/pages/projects/expenses/monthlyTracker/MonthlyExpenses";
import { AddCategories } from "@/pages/projects/expenses/addCategories/CategorizeExpenses";
import { VisualizeExpenses } from "@/pages/projects/expenses/visualize/VisualizeExpenses";

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
          { path: "expenses/monthlyTracker", Component: Expenses },
          { path: "expenses/addCategories", Component: AddCategories },
          { path: "expenses/visualize", Component: VisualizeExpenses },
        ],
      },
    ],
    errorElement: Error(),
  },
];

export const ROUTER = createBrowserRouter(Routes);
