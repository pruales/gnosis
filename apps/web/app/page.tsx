import { Button } from "@/components/ui/button";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import Link from "next/link";

export default async function Home() {
  return (
    <div className="w-full">
      <div className="container mx-auto">
        <div className="flex gap-8 py-20 lg:py-40 items-center justify-center flex-col">
          <div className="flex gap-4 flex-col">
            <h1 className="text-heading text-4xl max-w-2xl text-center">
              <span className="text-primary">Gnosis</span>
            </h1>

            <p className="text-muted-foreground max-w-2xl text-center">
              long term memory for agents
            </p>
          </div>

          <div className="flex flex-row gap-3">
            <SignedIn>
              <Button asChild variant="outline" size="lg" className="gap-4">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </SignedIn>
            <SignedOut>
              <Button variant="outline" size="lg" className="gap-4">
                Learn more →
              </Button>
              <SignInButton forceRedirectUrl={"/dashboard"}>
                <Button size="lg" className="gap-4">
                  Get started →
                </Button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
}
