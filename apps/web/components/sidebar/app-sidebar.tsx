"use client";

import * as React from "react";
import { useMemo } from "react";
import {
  Key,
  Brain,
  Pencil,
  MessageSquare,
  LayoutDashboard,
} from "lucide-react";
import { usePathname } from "next/navigation";

import { NavMain } from "@/components/sidebar/nav-main";
import { NavUser } from "@/components/sidebar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { OrgSwitcher } from "./org-switcher";

// Define navigation items outside the component to avoid recreating on every render
export const navigationItems = [
  {
    title: "API Keys",
    url: "/dashboard/api-keys",
    icon: Key,
  },
  {
    title: "Prompt Tuner",
    url: "/dashboard/prompt-tuner",
    icon: Pencil,
  },
  {
    title: "Memories",
    url: "#",
    icon: Brain,
    tag: "Coming Soon",
  },
  {
    title: "Playground",
    url: "#",
    icon: MessageSquare,
    tag: "Coming Soon",
  },
  {
    title: "Dashboard",
    url: "#",
    icon: LayoutDashboard,
    tag: "Coming Soon",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();

  // Memoize the navigation items with active state based on current path
  const platformItemsWithActive = useMemo(() => {
    return navigationItems.map((item) => ({
      ...item,
      isActive: item.url !== "#" && pathname.startsWith(item.url),
    }));
  }, [pathname]); // Only recalculate when pathname changes

  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-6">
        <NavMain items={platformItemsWithActive} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
