import { Outlet, Link, useParams } from "@remix-run/react";
import { redirect } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunction } from "@remix-run/cloudflare";
import {
  OrganizationSwitcher,
  UserButton,
  useOrganization,
} from "@clerk/remix";
import { Skeleton } from "~/components/ui/skeleton";
import { SyncActiveOrganization } from "~/components/SyncActiveOrganization";

type LoaderData = {
  orgId: string;
};

export const loader: LoaderFunction = async (args) => {
  const { userId, orgId } = await getAuth(args);
  const urlOrgId = args.params.orgId;

  if (!userId) {
    return redirect("/");
  }

  // If no active organization, redirect to org selection
  if (!orgId) {
    return redirect("/org-selection");
  }

  // If orgId from session doesn't match URL, redirect to the correct org
  if (orgId !== urlOrgId && urlOrgId?.startsWith("org_")) {
    return redirect(`/${orgId}/dashboard`);
  }

  return { orgId: urlOrgId } as LoaderData;
};

export default function OrganizationDashboardLayout() {
  const { isLoaded } = useOrganization();
  const { orgId } = useParams();

  // Show loading state while organization data is loading
  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-24" />
              <nav className="flex items-center gap-6">
                <Skeleton className="h-4 w-20" />
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-40" />
              <div className="h-6 w-px bg-border mx-1"></div>
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </header>
        <main className="container py-6 px-4">
          <Skeleton className="h-10 w-1/3 mb-6" />
          <div className="grid gap-6">
            <Skeleton className="h-40 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-opacity duration-200 animate-in fade-in">
      <SyncActiveOrganization />
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Link
              to={`/${orgId}/dashboard`}
              className="text-xl font-bold text-foreground"
            >
              Gnosis
            </Link>
            <nav className="flex items-center gap-6">
              <Link
                to={`/${orgId}/dashboard`}
                className="text-sm font-medium text-foreground"
              >
                Dashboard
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <OrganizationSwitcher hidePersonal={true} />
            <div className="h-6 w-px bg-border mx-1"></div>
            <UserButton />
          </div>
        </div>
      </header>
      <main className="container py-6 px-4 transition-opacity duration-300 animate-in fade-in">
        <Outlet />
      </main>
    </div>
  );
}
