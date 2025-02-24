import { useEffect } from "react";
import { useNavigate, useParams } from "@remix-run/react";
import { useAuth, useOrganizationList } from "@clerk/remix";

// This component will sync the active organization based on the orgId URL parameter
export function SyncActiveOrganization() {
  // Use `useOrganizationList()` to access the `setActive()` method
  const { setActive, isLoaded } = useOrganizationList();
  const navigate = useNavigate();

  // Get the organization ID from the session
  const { orgId: sessionOrgId } = useAuth();

  // Get the organization ID from the URL if available
  const params = useParams();
  const urlOrgId = params.orgId;

  useEffect(() => {
    if (!isLoaded) return;

    // If there's no orgId in the URL, just return
    if (!urlOrgId) return;

    // If the org ID in the URL is not valid, navigate to the organization selection page
    if (urlOrgId && !urlOrgId.startsWith("org_")) {
      navigate("/org-selection");
      return;
    }

    // If the org ID in the URL is not the same as
    // the org ID in the session (the active organization),
    // set the active organization to be the org ID from the URL
    if (urlOrgId && urlOrgId !== sessionOrgId) {
      void setActive({ organization: urlOrgId });
    }
  }, [sessionOrgId, isLoaded, setActive, urlOrgId, navigate]);

  // When user has no organization selected
  useEffect(() => {
    if (isLoaded && !sessionOrgId) {
      navigate("/org-selection");
    }
  }, [isLoaded, sessionOrgId, navigate]);

  return null;
}
