"use client";

import { useState } from "react";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function ApiKeyCreationFlow({
  onCreate,
}: {
  onCreate: (name: string) => Promise<{ apiKey: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [keyName, setKeyName] = useState("API Key");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleOpenDialog = () => {
    setDialogOpen(true);
    setCurrentStep(1);
    setKeyName("API Key");
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCurrentStep(1);
    setNewApiKey(null);
    setCopied(false);
  };

  const handleCreateKey = () => {
    startTransition(async () => {
      try {
        const result = await onCreate(keyName);
        setNewApiKey(result.apiKey);
        setCurrentStep(2);
      } catch {
        toast.error("Failed to create API key");
      }
    });
  };

  const copyToClipboard = () => {
    if (newApiKey) {
      navigator.clipboard.writeText(newApiKey);
      setCopied(true);
      toast.success("API key copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <Button
        onClick={handleOpenDialog}
        variant="outline"
        size="sm"
        className="hover:bg-muted/50 cursor-pointer"
      >
        New Production key
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {currentStep === 1 ? "Create New API Key" : "New API Key Created"}
            </DialogTitle>
            <DialogDescription>
              {currentStep === 1
                ? "Give your API key a name to help identify it later."
                : "This API key will only be shown once. Please save it in a secure place."}
            </DialogDescription>
          </DialogHeader>

          {currentStep === 1 ? (
            <div className="py-4">
              <Label htmlFor="key-name" className="mb-2 block">
                Key Name
              </Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="Enter a name for this API key"
                className="mb-4"
                autoFocus
              />
            </div>
          ) : (
            <div className="flex flex-col space-y-2 my-4">
              <div className="p-4 bg-muted rounded-md border flex items-center">
                <Key
                  size={16}
                  className="text-muted-foreground mr-2 flex-shrink-0"
                />
                <code className="text-xs overflow-x-auto flex-grow font-mono">
                  {newApiKey}
                </code>
              </div>
              <p className="text-xs text-muted-foreground">
                This key provides full access to your account. Don&apos;t share
                it publicly.
              </p>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between">
            {currentStep === 1 ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateKey}
                  disabled={isPending || !keyName.trim()}
                >
                  {isPending ? "Creating..." : "Create Key"}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={handleCloseDialog}>
                  Close
                </Button>
                <Button onClick={copyToClipboard} className="gap-2">
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? "Copied!" : "Copy API Key"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
