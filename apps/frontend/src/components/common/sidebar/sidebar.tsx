"use client";

import * as React from "react";
import {
  CalendarArrowUp,
  ChartBarStacked,
  Frame,
  GalleryVerticalEnd,
  IndianRupee,
  Pencil,
  Split,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarRail,
} from "shadcn-lib/dist/components/ui/sidebar";
import { TeamSwitcher } from "./team";
import { NavMain } from "./nav";
import { NavUser } from "./user";
import { NavProjects } from "./projects";
import { Mode } from "../mode";
import { useSelector } from "react-redux";
import { RootState } from "@/store/store";

// This is sample data.
const data = {
  teams: [
    {
      name: "Projects Ajay",
      logo: GalleryVerticalEnd,
      plan: "Personal",
    },
  ],
  navMain: [
    {
      title: "Expense Tracking",
      url: "#",
      icon: IndianRupee,
      isActive: true,
      items: [
        {
          title: "Add categories",
          url: "/projects/expenses/addCategories",
          icon: Split,
        },
        {
          title: "Monthly tracker",
          url: "/projects/expenses/monthlyTracker",
          icon: CalendarArrowUp,
        },
        {
          title: "Visualize expense",
          url: "/projects/expenses/expenseInsights",
          icon: ChartBarStacked,
        },
        {
          title: "Update expense",
          url: "/projects/expenses/updateExpense",
          icon: Pencil,
        },
      ],
    },
    // {
    //   title: "Models",
    //   url: "#",
    //   icon: Bot,
    //   items: [
    //     {
    //       title: "Genesis",
    //       url: "#",
    //     },
    //     {
    //       title: "Explorer",
    //       url: "#",
    //     },
    //     {
    //       title: "Quantum",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Documentation",
    //   url: "#",
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: "Introduction",
    //       url: "#",
    //     },
    //     {
    //       title: "Get Started",
    //       url: "#",
    //     },
    //     {
    //       title: "Tutorials",
    //       url: "#",
    //     },
    //     {
    //       title: "Changelog",
    //       url: "#",
    //     },
    //   ],
    // },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "General",
    //       url: "#",
    //     },
    //     {
    //       title: "Team",
    //       url: "#",
    //     },
    //     {
    //       title: "Billing",
    //       url: "#",
    //     },
    //     {
    //       title: "Limits",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
  projects: [
    {
      name: "Expense Tracking",
      url: "/projects/expenses/monthlyTracker",
      icon: Frame,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useSelector((state: RootState) => state.auth.user);
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} />
        <SidebarGroup>
          <SidebarGroupLabel>Mode</SidebarGroupLabel>
          <SidebarMenu>
            <Mode />
          </SidebarMenu>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            ...user,
            picture: user?.picture || "",
            name: user?.name || user?.email,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
