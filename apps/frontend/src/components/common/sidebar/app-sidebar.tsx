import {
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "shadcn-lib/dist/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

export const AppMainSidebar = ({ children }: { children: React.ReactNode }) => {
  const { heading } = useSelector((state: RootState) => state.nav);
  return (
    <>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className='bg-card relative overflow-hidden max-w-full max-h-[100vh]'>
          <SidebarTrigger className='sticky top-2 z-50' />
          <div className='overflow-auto'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
};
