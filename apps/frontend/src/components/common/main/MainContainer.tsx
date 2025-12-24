import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppMainSidebar } from "../sidebar/app-sidebar";
import { useAuthCheck } from "@/hooks/authHooks";
import { Loader } from "../storybook/loader";

export const MainContainer = () => {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const location = useLocation();

  if (isLoading) {
    return <Loader />;
  }

  const isAuthRoute = location.pathname.startsWith("/auth");

  // 🚫 unauthenticated → auth pages only
  if (!isAuthenticated && !isAuthRoute) {
    return <Navigate to='/auth' replace />;
  }

  // 🚫 authenticated users should not see auth pages
  if (isAuthenticated && isAuthRoute) {
    return <Navigate to='/' replace />;
  }

  // ✅ app layout
  return isAuthenticated ? (
    <AppMainSidebar>
      <Outlet />
    </AppMainSidebar>
  ) : (
    <Outlet />
  );
};
