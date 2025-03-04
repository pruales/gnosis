import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { KeyRound, Wand2, Brain } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-4">
        <h1 className="text-3xl font-light tracking-tight text-heading">
          Welcome to Gnosis
        </h1>
        <p className="font-light text-body">
          Get started by managing your API keys, fine-tuning your prompts, or
          viewing your memories.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/dashboard/api-keys" className="block">
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="space-y-0 p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center">
                  <KeyRound className="w-6 h-6 text-foreground stroke-[1]" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="leading-tight">API Keys</CardTitle>
                  <CardDescription className="leading-snug">
                    Manage your API keys and access credentials
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/prompts" className="block">
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="space-y-0 p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-foreground stroke-[1]" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="leading-tight">Prompts</CardTitle>
                  <CardDescription className="leading-snug">
                    Fine-tune and manage your memory extraction prompts
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/dashboard/memories" className="block">
          <Card className="hover:bg-muted/50 transition-colors h-full">
            <CardHeader className="space-y-0 p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-foreground stroke-[1]" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="leading-tight">Memories</CardTitle>
                  <CardDescription className="leading-snug">
                    View and manage your stored memories
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
