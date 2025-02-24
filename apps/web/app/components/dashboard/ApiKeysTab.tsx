import { useState, useEffect } from "react";
import { FetcherWithComponents } from "@remix-run/react";
import { Key, RotateCcw, Trash2, Check, Copy } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
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
} from "../../components/ui/alert-dialog";

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

  useEffect(() => {
    if (
      fetcher.data?.apiKey &&
      fetcher.data?.apiKey !== newApiKey &&
      fetcher.data?.action === "create_api_key"
    ) {
      setNewApiKey(fetcher.data.apiKey);
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

  const isCreatingApiKey =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("action") === "create_api_key";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Your API Keys</h2>
        <Button
          onClick={createApiKey}
          disabled={isCreatingApiKey}
          className="gap-2"
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

      {newApiKey && (
        <Card className="mb-6 border-yellow-200 bg-yellow-50 text-yellow-900 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-200">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">New API Key Created</h3>
            <p className="text-sm mb-2">
              Copy this key now. You won&apos;t be able to see it again!
            </p>
            <div className="flex items-center gap-2 font-mono text-sm bg-white dark:bg-black/20 p-2 rounded-md">
              <code className="flex-1 break-all">{newApiKey}</code>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleCopy(newApiKey)}
                className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="Copy API key"
              >
                {copiedKey === newApiKey ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {apiKeys.length === 0 ? (
        <div className="text-center p-6 text-muted-foreground">
          <p>You don&apos;t have any API keys yet.</p>
        </div>
      ) : (
        <div className="divide-y">
          {apiKeys.map((key) => (
            <div
              key={key.id}
              className="py-4 flex items-center justify-between"
            >
              <div>
                <div className="font-medium flex items-center">
                  <Key className="mr-2 h-4 w-4" />
                  API Key {key.id}
                </div>
                <div className="text-sm text-muted-foreground">
                  Created: {new Date(key.createdAt).toLocaleDateString()}
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={() => confirmRevokeApiKey(key.id)}
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Revoke
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Are you absolutely sure?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently revoke
                      the API key and it will no longer be able to authenticate
                      requests.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setKeyToRevoke(null)}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction onClick={handleRevokeApiKey}>
                      Revoke
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
