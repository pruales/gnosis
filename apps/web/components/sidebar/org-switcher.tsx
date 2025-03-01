"use client";

import * as React from "react";
import {
  OrganizationSwitcher,
  useAuth,
  useOrganizationList,
} from "@clerk/nextjs";
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";

export function OrgSwitcher() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { isLoaded, orgId } = useAuth();
  const {
    userMemberships,
    isLoaded: isOrgListLoaded,
    setActive,
  } = useOrganizationList({
    userMemberships: true,
  });

  React.useEffect(() => {
    const membershipResourceLoading = userMemberships.isLoading;
    if (
      !orgId &&
      isLoaded &&
      isOrgListLoaded &&
      !membershipResourceLoading &&
      userMemberships.count === 0
    ) {
      redirect("/org-selection");
    }

    if (!orgId && setActive && userMemberships.data?.[0]) {
      const setActiveOrg = async () => {
        await userMemberships.revalidate();
        setActive(userMemberships.data?.[0]);
      };

      setActiveOrg().catch(console.error);
    }
  }, [orgId, isLoaded, isOrgListLoaded, userMemberships, setActive]);

  if (!isLoaded || !orgId) {
    return (
      <SidebarMenu>
        <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
          <div
            className={cn(
              "flex items-center",
              isCollapsed ? "justify-center p-0" : "w-full p-2"
            )}
          >
            <Skeleton className={cn("size-6 rounded-lg")} />
            {!isCollapsed && (
              <div className="grid flex-1 text-left ml-2">
                <Skeleton className="h-3 w-24" />
              </div>
            )}
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem className={cn(isCollapsed && "flex justify-center")}>
        <OrganizationSwitcher
          hidePersonal={true}
          appearance={{
            elements: {
              // Root container - match exact spacing of other sidebar items
              rootBox: cn(isCollapsed && "!p-0"),
              // Trigger button styling to match sidebar icons exactly
              organizationSwitcherTrigger: cn(
                "flex !items-center !gap-2 !rounded-lg !text-sm",
                "!text-sidebar-foreground hover:!text-sidebar-accent-foreground",
                "hover:!bg-sidebar-accent",
                "data-[state=open]:!bg-sidebar-accent data-[state=open]:!text-sidebar-accent-foreground",
                "!transition-colors !duration-200",
                !isCollapsed
                  ? "w-full !justify-start !px-2 !py-2"
                  : "justify-center items-center rounded-sm !p-2"
              ),

              // Organization avatar in the trigger
              organizationPreviewAvatarContainer__organizationSwitcherTrigger:
                cn("!shrink-0"),

              organizationPreviewAvatar__organizationSwitcherTrigger:
                cn("!size-4"),

              organizationPreviewTextContainer__organizationSwitcherTrigger: cn(
                isCollapsed && "!hidden",
                !isCollapsed && "flex-1 !text-left"
              ),

              organizationPreviewTextContainer__organizationSwitcherListedOrganization:
                cn("!text-sidebar-foreground"),

              userPreviewTextContainer__personalWorkspace: cn(
                isCollapsed && "!hidden",
                !isCollapsed && "flex-1 !text-left"
              ),

              userPreviewTextContainer__personalWorkspaceSwitcherListedUser: cn(
                "!text-sidebar-foreground"
              ),

              organizationSwitcherTriggerIcon: cn(
                "!ml-auto size-4 !text-sidebar-foreground !mr-1.5",
                isCollapsed && "!hidden"
              ),
              // Popover/dropdown menu - adjust positioning in collapsed mode
              organizationSwitcherPopoverCard: cn(
                isCollapsed ? "w-56 fixed ml-16" : "ml-2",
                "bg-sidebar border-sidebar-border"
              ),
              // Label in dropdown
              organizationSwitcherPopoverActionText:
                "text-xs text-sidebar-foreground/70 py-2 px-2",
              // Menu items
              organizationSwitcherPopoverAction:
                "flex gap-2 items-center p-2 text-sm rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
              // Avatar in menu items
              organizationPreviewAvatar: "size-5 rounded-md",
              // Checkmark for active org
              organizationSwitcherPopoverActionActiveIcon:
                "ml-auto h-4 w-4 text-sidebar-foreground",
              // Dividers
              organizationSwitcherPopoverActionSeparator:
                "my-1 border-t border-sidebar-border",
              // Create organization section
              createOrganizationBox:
                "flex items-center gap-2 p-2 border-t border-sidebar-border mt-1 pt-1 text-sm text-sidebar-foreground",
              // Icon for create org button
              createOrganizationIconBox:
                "flex size-6 items-center justify-center rounded-md border bg-sidebar-accent",
              // Organization name text
              organizationPreviewText:
                "font-medium text-sm text-sidebar-foreground",
              // User name in personal workspace
              userPreviewText: "font-medium text-sm text-sidebar-foreground",
              // Modal title text
              modalTitle: "text-lg font-semibold text-foreground",
              // Modal text inputs
              formFieldInput: "text-sm text-foreground bg-background",
              // Organization name in dropdown
              organizationPreviewText__organizationSwitcherTrigger:
                "text-sm text-sidebar-foreground truncate",
              // Buttons in organization modal
              formButtonPrimary: "text-sm font-medium",
              formButtonReset: "text-sm text-muted-foreground",
            },
          }}
          organizationProfileMode="modal"
          createOrganizationMode="modal"
          afterCreateOrganizationUrl="/dashboard"
          afterLeaveOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
