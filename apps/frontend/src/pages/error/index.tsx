import { AppMainSidebar } from "@/components/common/sidebar/app-sidebar";
import { Card, CardContent, CardHeader } from "shadcn-lib/dist/components/ui/card";

export const Error = () => {
  return (
    <AppMainSidebar>
      <div>
        <Card className='m-8'>
          <CardHeader>Error 404: Page Not found</CardHeader>
          <CardContent>Please navigate to the routes in Sidebar</CardContent>
        </Card>
      </div>
    </AppMainSidebar>
  );
};
