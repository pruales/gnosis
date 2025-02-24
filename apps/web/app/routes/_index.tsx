import type { MetaFunction, LoaderFunction } from "@remix-run/cloudflare";
import { useUser } from "@clerk/remix";
import { redirect } from "@remix-run/react";
import { getAuth } from "@clerk/remix/ssr.server";
import { SignInButton } from "@clerk/remix";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [{ title: "Gnosis" }, { name: "description", content: "Gnosis" }];
};

// Redirect to dashboard if user is already signed in
export const loader: LoaderFunction = async (args) => {
  const { userId, orgId } = await getAuth(args);

  // If authenticated and has an active organization, redirect to org-specific dashboard
  if (userId && orgId) {
    return redirect(`/${orgId}/dashboard`);
  }

  // If authenticated but no active organization, redirect to org selection
  if (userId) {
    return redirect("/org-selection");
  }

  return null;
};

export default function Index() {
  const { isSignedIn } = useUser();

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 container py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-6 text-center">
            <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
              Gnosis
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Long term memory for agents
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              {isSignedIn ? (
                <Button asChild size="lg">
                  <a href="/org-selection">Go to Dashboard</a>
                </Button>
              ) : (
                <SignInButton mode="modal">
                  <Button size="lg">Sign In</Button>
                </SignInButton>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
