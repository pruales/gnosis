import { useState, useEffect } from "react";
import { FetcherWithComponents } from "@remix-run/react";
import { Key, RotateCcw, Trash2, Check, Copy, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import {
  Card,
  CardDescription,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { ScrollArea } from "~/components/ui/scroll-area";

type ApiKey = {
  id: string;
  createdAt: string;
  revoked: boolean;
};

type ActionData = {
  success?: boolean;
  message?: string;
  apiKey?: string;
  promptContent?: PromptMessage[];
  error?: string;
  action?: string;
};

type PromptMessage = {
  role: string;
  content: string;
};

type ApiKeysTabProps = {
  apiKeys: ApiKey[];
  fetcher: FetcherWithComponents<ActionData>;
  newApiKey?: string;
};

export function ApiKeysTab({
  apiKeys,
  fetcher,
  newApiKey: initialNewApiKey,
}: ApiKeysTabProps) {
  const [copiedKey, setCopiedKey] = useState("");
  const [newApiKey, setNewApiKey] = useState(initialNewApiKey || "");
  const [keyToRevoke, setKeyToRevoke] = useState<string | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  useEffect(() => {
    if (
      fetcher.data?.apiKey &&
      fetcher.data?.apiKey !== newApiKey &&
      fetcher.data?.action === "create_api_key"
    ) {
      setNewApiKey(fetcher.data.apiKey);
      setIsApiKeyModalOpen(true);
    }
  }, [fetcher.data, newApiKey]);

  const handleCopy = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const createApiKey = () => {
    fetcher.submit({ action: "create_api_key" }, { method: "post" });
  };

  const confirmRevokeApiKey = (id: string) => {
    setKeyToRevoke(id);
  };

  const handleRevokeApiKey = () => {
    if (keyToRevoke) {
      fetcher.submit(
        { action: "revoke_api_key", keyId: keyToRevoke },
        { method: "post" }
      );
      setKeyToRevoke(null);
    }
  };

  const closeApiKeyModal = () => {
    setIsApiKeyModalOpen(false);
  };

  const isCreatingApiKey =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("action") === "create_api_key";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Your API Keys</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your API keys for accessing the Gnosis API
          </p>
        </div>
        <Button
          onClick={createApiKey}
          disabled={isCreatingApiKey}
          className="gap-2 transition-all duration-200 hover:scale-[1.02]"
        >
          {isCreatingApiKey ? (
            <>
              <RotateCcw className="h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <Key className="h-4 w-4" />
              Create New Key
            </>
          )}
        </Button>
      </div>

      {/* API Key Modal */}
      <AlertDialog open={isApiKeyModalOpen} onOpenChange={setIsApiKeyModalOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              New API Key Created
            </AlertDialogTitle>
            <AlertDialogDescription>
              Copy this key now. You won&apos;t be able to see it again!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 font-mono text-sm bg-muted/50 p-3 rounded-md my-4 border border-border">
            <code className="flex-1 break-all">{newApiKey}</code>
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleCopy(newApiKey)}
              className="p-1 rounded-md transition-all hover:bg-primary hover:text-primary-foreground"
              aria-label="Copy API key"
            >
              {copiedKey === newApiKey ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={closeApiKeyModal}
              className="transition-all duration-200 hover:scale-[1.02]"
            >
              I&apos;ve copied my key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {apiKeys.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/20">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <Key className="h-12 w-12 text-muted-foreground/60 mb-4" />
            <CardTitle className="text-lg mb-2">No API Keys</CardTitle>
            <CardDescription className="max-w-sm">
              You don&apos;t have any active API keys yet. Create your first key
              to start integrating with the Gnosis API.
            </CardDescription>
            <Button
              className="mt-6 gap-2 transition-all duration-200 hover:scale-[1.02]"
              onClick={createApiKey}
              disabled={isCreatingApiKey}
            >
              {isCreatingApiKey ? (
                <>
                  <RotateCcw className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  Create Your First Key
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="rounded-md border">
          <div className="divide-y">
            {apiKeys.map((key) => (
              <Card
                key={key.id}
                className="rounded-none border-0 shadow-none bg-transparent hover:bg-muted/30 transition-colors duration-200"
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        API Key {key.id.substring(0, 8)}
                        <Badge
                          variant="outline"
                          className="ml-2 text-xs font-normal"
                        >
                          Active
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        Created:{" "}
                        {new Date(key.createdAt).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        onClick={() => confirmRevokeApiKey(key.id)}
                        variant="outline"
                        size="sm"
                        className="gap-1 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Revoke API Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          revoke the API key and it will no longer be able to
                          authenticate requests.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setKeyToRevoke(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRevokeApiKey}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
                        >
                          Revoke Key
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
