import {
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "shadcn-lib/dist/components/ui/sidebar";
import { AppSidebar } from "./sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "shadcn-lib/dist/components/ui/breadcrumb";
import { Mode } from "../mode";

export const AppMainSidebar = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <div>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'>
              <div className='flex items-center gap-2 px-4'>
                <SidebarTrigger className='-ml-1' />
                <SidebarSeparator
                  orientation='vertical'
                  className='mr-2 data-[orientation=vertical]:h-4'
                />
                {/* <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className='hidden md:block'>
                      <BreadcrumbLink href='#'>Building Your Application</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className='hidden md:block' />
                    <BreadcrumbItem>
                      <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb> */}
              </div>
              <Mode />
            </header>
            {children}
          </SidebarInset>
        </SidebarProvider>
      </div>
    </>
  );
};
