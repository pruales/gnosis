import { OrganizationList, UserButton, useUser } from "@clerk/remix";
import { useSearchParams } from "@remix-run/react";
import { redirect, type LoaderFunction } from "@remix-run/cloudflare";
import { getAuth } from "@clerk/remix/ssr.server";

export const loader: LoaderFunction = async (args) => {
  const { userId, orgId } = await getAuth(args);

  // If not signed in, redirect to home
  if (!userId) {
    return redirect("/");
  }

  // If already has an active organization, redirect to dashboard
  if (orgId) {
    return redirect(`/${orgId}/dashboard`);
  }

  return null;
};

export default function OrganizationSelection() {
  const { isLoaded: isUserLoaded } = useUser();
  const [searchParams] = useSearchParams();
  const redirectUrl =
    searchParams.get("redirectUrl") ?? "redirect-to-dashboard";

  // Custom URL generator for the redirect-to-dashboard case
  const getRedirectUrl = (orgId: string) => {
    if (redirectUrl === "redirect-to-dashboard") {
      return `/${orgId}/dashboard`;
    }
    return redirectUrl;
  };

  // Show loading state while user data is loading
  if (!isUserLoaded) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-lg font-medium text-muted-foreground">
              Loading...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-xl font-bold text-foreground">Gnosis</span>
          </div>
          <UserButton />
        </div>
      </header>
      <main className="container py-6 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8 space-y-4">
            <h1 className="text-3xl font-bold tracking-tight">
              Organization Selection
            </h1>
            <p className="text-lg text-muted-foreground">
              To access Gnosis, you need to be part of an organization. You can
              create a new organization or select an existing one below.
            </p>
          </div>

          <div className="border rounded-lg p-6 bg-card shadow-sm">
            <OrganizationList
              hidePersonal={true}
              afterCreateOrganizationUrl={
                redirectUrl === "redirect-to-dashboard"
                  ? undefined
                  : redirectUrl
              }
              afterSelectOrganizationUrl={
                redirectUrl === "redirect-to-dashboard"
                  ? undefined
                  : redirectUrl
              }
              {...(redirectUrl === "redirect-to-dashboard" && {
                afterCreateOrganizationUrlCallback: getRedirectUrl,
                afterSelectOrganizationUrlCallback: getRedirectUrl,
              })}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
