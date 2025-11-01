import { MainContainer } from "@/components/common/main/MainContainer";
import { LoginForm } from "@/pages/auth/LoginOrSignup";
import { Expenses } from "@/pages/projects/expenses/Expenses";
import { createBrowserRouter, RouteObject } from "react-router-dom";
import { ProtectedRoutes } from "./ProtectedRoutes";
import { Projects } from "@/pages/projects";
import { Home } from "@/pages/home";
import { Error } from "@/pages/error";

const Routes: RouteObject[] = [
  {
    path: "/",
    Component: MainContainer,
    children: [
      { index: true, Component: Home },
      {
        path: "/auth",
        Component: LoginForm,
      },
      {
        path: "projects",
        Component: ProtectedRoutes,
        children: [
          { index: true, Component: Projects },
          { path: "expenses", Component: Expenses },
        ],
      },
    ],
    errorElement: Error(),
  },
];

export const ROUTER = createBrowserRouter(Routes);
