"use client";

import { useState } from "react";
import { Message } from "@gnosis.dev/sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  updateInstructionsPrompt,
  resetInstructionsPrompt,
  getInstructionsPrompt,
} from "@/app/dashboard/prompt-tuner/actions";
import { PromptTunerMessageEditor } from "./prompt-tuner-message-editor";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";

interface PromptEditorProps {
  initialPrompt: Message[];
}

export function PromptTunerEditor({ initialPrompt }: PromptEditorProps) {
  // Extract the initial instruction prompt from messages (use the first system message or empty string)
  const getInitialInstructionPrompt = (): string => {
    const systemMessage = initialPrompt.find((msg) => msg.role === "system");
    return systemMessage?.content || "";
  };

  const [instructionPrompt, setInstructionPrompt] = useState<string>(
    getInitialInstructionPrompt()
  );
  const [currentPrompt, setCurrentPrompt] = useState<string>(
    getInitialInstructionPrompt()
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleUpdatePrompt = async () => {
    setIsSaving(true);

    // Optimistic update - immediately update the displayed prompt
    setCurrentPrompt(instructionPrompt);
    setIsEditing(false);

    try {
      // Convert the instruction prompt to a messages array with a single system message
      const updatedMessages: Message[] = [
        { role: "system", content: instructionPrompt },
      ];

      await updateInstructionsPrompt(updatedMessages);
      toast.success("Instruction prompt updated successfully");
    } catch (err) {
      // Revert to the original prompt if the update fails
      setCurrentPrompt(getInitialInstructionPrompt());
      toast.error(
        err instanceof Error ? err.message : "Failed to update prompt"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPrompt = async () => {
    setIsResetting(true);

    try {
      // Reset the prompt on the server
      await resetInstructionsPrompt();

      // Fetch the updated prompt
      const updatedPrompt = await getInstructionsPrompt();

      // Update local state with the fetched prompt
      const systemMessage = updatedPrompt.find((msg) => msg.role === "system");
      if (systemMessage) {
        setCurrentPrompt(systemMessage.content);
        setInstructionPrompt(systemMessage.content);
      }

      setShowResetDialog(false);
      toast.success("Prompt reset to default");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reset prompt"
      );
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="mt-6 space-y-6">
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset to Default Prompt</DialogTitle>
            <DialogDescription>
              Are you sure you want to reset to the default prompt? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowResetDialog(false)}
              disabled={isResetting}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleResetPrompt}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Reset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Instruction Prompt</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false);
                      setInstructionPrompt(currentPrompt);
                    }}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUpdatePrompt}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => setShowResetDialog(true)}
                    disabled={isResetting}
                  >
                    {isResetting ? "Resetting..." : "Reset to Default"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    Edit Prompt
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <PromptTunerMessageEditor
              prompt={instructionPrompt}
              onUpdate={setInstructionPrompt}
            />
          ) : (
            <Tabs defaultValue="rendered" className="w-full">
              <TabsList>
                <TabsTrigger value="rendered">Rendered</TabsTrigger>
                <TabsTrigger value="raw">Raw</TabsTrigger>
              </TabsList>
              <TabsContent value="rendered" className="space-y-4 pt-4">
                <Textarea readOnly value={currentPrompt} rows={12} />
              </TabsContent>
              <TabsContent value="raw" className="pt-4">
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[500px] whitespace-pre-wrap break-words w-full">
                  {JSON.stringify(
                    [{ role: "system", content: currentPrompt }],
                    null,
                    2
                  )}
                </pre>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
