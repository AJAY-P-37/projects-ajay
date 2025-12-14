import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppMainSidebar } from "../sidebar/app-sidebar";
import { useAuthCheck } from "@/hooks/authHooks";
import { Skeleton } from "shadcn-lib/dist/components/ui/skeleton";

export const MainContainer = () => {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className='flex flex-1 p-4'>
        <Skeleton className='min-h-[100vh] flex-1 rounded-xl' />
      </div>
    );
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
