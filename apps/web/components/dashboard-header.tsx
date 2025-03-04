"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@radix-ui/react-separator";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { navigationItems } from "@/components/sidebar/app-sidebar";

// Helper function to get page title from pathname
function getPageTitle(pathname: string): string {
  if (pathname === "/dashboard" || pathname === "/dashboard/")
    return "Dashboard";

  // First try to match with navigation items
  const navItem = navigationItems.find(
    (item: { url: string; title: string }) =>
      item.url !== "#" &&
      item.url !== "/dashboard" && // Exclude dashboard from general matching
      pathname.startsWith(item.url)
  );

  return navItem?.title || "";
}

export function DashboardHeader() {
  const pathname = usePathname();

  // Memoize the page title to avoid recalculation on re-renders
  const pageTitle = useMemo(() => getPageTitle(pathname), [pathname]);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-6">
      <SidebarTrigger className="-ml-2" />
      <Separator orientation="vertical" className="h-5" />
      <h1 className="text-heading text-xl">{pageTitle}</h1>
    </header>
  );
}
