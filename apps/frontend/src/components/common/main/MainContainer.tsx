import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AppMainSidebar } from "../sidebar/app-sidebar";
import { useAuthCheck, useLogout } from "@/hooks/authHooks";
import { Skeleton } from "shadcn-lib/dist/components/ui/skeleton";

export const MainContainer = () => {
  const { isAuthenticated, isLoading } = useAuthCheck();
  const location = useLocation();
  const logout = useLogout();

  if (isLoading)
    return (
      <div className='flex flex-1 flex-col gap-4 p-4'>
        {/* <Skeleton className='grid auto-rows-min gap-4 md:grid-cols-3'>
          <Skeleton className='bg-muted/50 aspect-video rounded-xl' />
          <Skeleton className='bg-muted/50 aspect-video rounded-xl' />
          <Skeleton className='bg-muted/50 aspect-video rounded-xl' />
        </Skeleton> */}
        <Skeleton className='bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min' />
      </div>
    );

  const isAuthRoute = location.pathname.startsWith("/auth");

  // 🚫 User not logged in and not already on /auth → redirect to /auth
  if (!isAuthenticated && !isAuthRoute) {
    logout();
    return <Navigate to='/auth' state={{ from: location }} replace />;
  }

  // ✅ User logged in but tries to visit /auth → redirect to home
  if (isAuthenticated && isAuthRoute) {
    return <Navigate to='/' replace />;
  }

  // ✅ Wrap everything else with sidebar if logged in
  return isAuthenticated ? (
    <AppMainSidebar>
      <Outlet />
    </AppMainSidebar>
  ) : (
    <Outlet />
  );
};
