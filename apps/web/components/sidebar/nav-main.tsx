"use client";

import { type LucideIcon } from "lucide-react";
import Link from "next/link";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useSidebar } from "@/components/ui/sidebar";

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    tag?: string;
  }[];
}) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-nav-label">PLATFORM</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={item.isActive}
              tooltip={item.title}
            >
              <Link
                href={item.url}
                className="flex items-center w-full whitespace-nowrap text-nav-item"
              >
                {item.icon && (
                  <item.icon className="size-4 shrink-0 mr-2 text-foreground opacity-80" />
                )}
                <span className="truncate">{item.title}</span>
                {item.tag && (
                  <span
                    className={`ml-auto rounded bg-muted px-1.5 py-0.5 text-xs font-light text-muted-foreground transition-opacity duration-200 ${
                      isCollapsed ? "opacity-0" : "opacity-100"
                    }`}
                    style={{ minWidth: "fit-content" }}
                  >
                    {item.tag}
                  </span>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

export function NavSettings({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="text-nav-label">Settings</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={item.isActive}
              tooltip={item.title}
            >
              <Link
                href={item.url}
                className="flex items-center w-full whitespace-nowrap text-nav-item"
              >
                {item.icon && (
                  <item.icon className="size-4 shrink-0 mr-2 text-foreground opacity-80" />
                )}
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
