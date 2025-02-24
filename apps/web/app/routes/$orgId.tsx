import { Outlet } from "@remix-run/react";
import { redirect } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunction } from "@remix-run/cloudflare";
import { SyncActiveOrganization } from "~/components/SyncActiveOrganization";

export const loader: LoaderFunction = async (args) => {
  const { userId } = await getAuth(args);

  // If not signed in, redirect to home
  if (!userId) {
    return redirect("/");
  }

  // Extract the orgId from the URL
  const { params } = args;
  const urlOrgId = params.orgId;

  // Validate that urlOrgId is a valid organization ID
  if (urlOrgId && !urlOrgId.startsWith("org_")) {
    return redirect("/org-selection");
  }

  // If orgId in session doesn't match the one in URL, we'll let the client-side
  // SyncActiveOrganization component handle the switch

  return null;
};

export default function OrganizationLayout() {
  return (
    <>
      <SyncActiveOrganization />
      <Outlet />
    </>
  );
}
