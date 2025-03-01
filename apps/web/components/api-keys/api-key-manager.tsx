"use client";

import { Button } from "@/components/ui/button";
import { Key, Trash, Copy, Check } from "lucide-react";
import { ApiKey } from "@gnosis.dev/sdk";
import { formatDistanceToNow } from "date-fns";
import { useTransition, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Component to display a newly created API key with copy functionality in a dialog
export function ApiKeyDialog({
  apiKey,
  isOpen,
  onClose,
}: {
  apiKey: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New API Key Created</DialogTitle>
          <DialogDescription>
            This API key will only be shown once. Please save it in a secure
            place.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col space-y-2 my-4">
          <div className="p-4 bg-muted rounded-md border flex items-center">
            <Key
              size={16}
              className="text-muted-foreground mr-2 flex-shrink-0"
            />
            <code className="text-xs overflow-x-auto flex-grow font-mono">
              {apiKey}
            </code>
          </div>
          <p className="text-xs text-muted-foreground">
            This key provides full access to your account. Don&apos;t share it
            publicly.
          </p>
        </div>

        <DialogFooter className="flex sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={copyToClipboard} className="gap-2">
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? "Copied!" : "Copy API Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Client component for API key actions with toast notifications
export function ApiKeyActions({
  apiKey,
  onRevoke,
}: {
  apiKey: ApiKey;
  onRevoke: (keyId: string) => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRevoke = () => {
    startTransition(async () => {
      try {
        await onRevoke(apiKey.id);
        toast.success("API key revoked successfully");
      } catch {
        toast.error("Failed to revoke API key");
      }
    });
  };

  return (
    <Button
      onClick={handleRevoke}
      disabled={isPending}
      variant="ghost"
      size="icon"
      className="cursor-pointer hover:border-destructive/50 hover:bg-destructive/20"
    >
      <Trash size={16} className="text-destructive" />
    </Button>
  );
}

// Client component for creating API keys
export function CreateApiKeyButton({
  onCreate,
}: {
  onCreate: (name: string) => Promise<{ apiKey: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showNameInput, setShowNameInput] = useState(false);
  const [keyName, setKeyName] = useState("API Key");

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const result = await onCreate(keyName);
        setNewApiKey(result.apiKey);
        setDialogOpen(true);
        setShowNameInput(false);
        setKeyName("API Key");
      } catch {
        toast.error("Failed to create API key");
      }
    });
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  return (
    <>
      {!showNameInput ? (
        <Button
          onClick={() => setShowNameInput(true)}
          variant="outline"
          size="sm"
          className="hover:bg-muted/50 cursor-pointer"
        >
          New Production key
        </Button>
      ) : (
        <div className="flex flex-col space-y-2 p-4 border rounded-md">
          <Label htmlFor="key-name">Key Name</Label>
          <Input
            id="key-name"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="Enter a name for this API key"
            className="mb-2"
          />
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowNameInput(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={isPending} size="sm">
              Create Key
            </Button>
          </div>
        </div>
      )}

      {newApiKey && (
        <ApiKeyDialog
          apiKey={newApiKey}
          isOpen={dialogOpen}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}

// Main API keys table component
export function ApiKeysTable({
  apiKeys,
  onRevoke,
}: {
  apiKeys: ApiKey[];
  onRevoke: (keyId: string) => Promise<void>;
}) {
  if (apiKeys.length === 0) {
    return (
      <div className="mt-4 p-4 text-center text-muted-foreground border rounded-md">
        No API keys found. Create one to get started.
      </div>
    );
  }

  return (
    <table className="w-full border-collapse mt-4">
      <thead>
        <tr className="border-b text-left">
          <th className="py-3 px-4 text-nav-label">NAME</th>
          <th className="py-3 px-4 text-nav-label">KEY</th>
          <th className="py-3 px-4 text-nav-label">CREATOR</th>
          <th className="py-3 px-4 text-nav-label">CREATED</th>
          <th className="py-3 px-4"></th>
        </tr>
      </thead>
      <tbody>
        {apiKeys.map((key) => (
          <tr key={key.id} className="border-b">
            <td className="py-3 px-4 text-body">{key.name || "API Key"}</td>
            <td className="py-3 px-4 flex items-center gap-2 text-body">
              <Key size={16} className="text-muted-foreground" />
              ••••••{key.id.substring(key.id.length - 4)}
            </td>
            <td className="py-3 px-4 text-body">{key.creator || "Unknown"}</td>
            <td className="py-3 px-4 text-body">
              {formatDistanceToNow(new Date(key.createdAt), {
                addSuffix: true,
              })}
            </td>
            <td className="py-3 px-4 flex items-center gap-2 justify-end">
              <ApiKeyActions apiKey={key} onRevoke={onRevoke} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
