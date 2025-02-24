import { useState } from "react";
import { FetcherWithComponents } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
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

type PromptMessage = {
  role: string;
  content: string;
};

type ActionData = {
  success?: boolean;
  message?: string;
  apiKey?: string;
  promptContent?: PromptMessage[];
  error?: string;
  action?: string;
};

type PromptsTabProps = {
  initialPromptContent: PromptMessage[];
  fetcher: FetcherWithComponents<ActionData>;
  DEFAULT_SYSTEM_PROMPT: string;
};

export function PromptsTab({
  initialPromptContent,
  fetcher,
  DEFAULT_SYSTEM_PROMPT,
}: PromptsTabProps) {
  const [prompt, setPrompt] = useState<PromptMessage[]>(
    initialPromptContent || []
  );
  const [activePromptTab, setActivePromptTab] = useState("0");
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  const promptTabs = [
    { id: "0", label: "Edit Messages" },
    { id: "1", label: "JSON View" },
  ];

  // Prompt methods
  const handleContentChange = (index: number, content: string) => {
    const newPrompt = [...prompt];
    newPrompt[index].content = content;
    setPrompt(newPrompt);
  };

  const addMessage = (role: "system" | "user" | "assistant") => {
    setPrompt([...prompt, { role, content: "" }]);
    // Wait for UI to update, then focus the new textarea
    setTimeout(() => {
      const textareas = document.querySelectorAll("textarea");
      textareas[textareas.length - 1].focus();
    }, 100);
  };

  const removeMessage = (index: number) => {
    const newPrompt = [...prompt];
    newPrompt.splice(index, 1);
    setPrompt(newPrompt);
  };

  const savePrompt = () => {
    fetcher.submit(
      {
        action: "save_prompt",
        promptContent: JSON.stringify(prompt),
      },
      { method: "post" }
    );
  };

  const resetPrompt = () => {
    setPrompt([
      {
        role: "system",
        content: DEFAULT_SYSTEM_PROMPT,
      },
    ]);
    setIsResetDialogOpen(false);
  };

  const isSavingPrompt =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("action") === "save_prompt";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Fact Extraction Prompt</h2>
        <div className="flex gap-2">
          <AlertDialog
            open={isResetDialogOpen}
            onOpenChange={setIsResetDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button variant="outline">Reset to Default</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the prompt to the default settings and discard
                  all your changes.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={resetPrompt}>
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button onClick={savePrompt} disabled={isSavingPrompt}>
            {isSavingPrompt ? "Saving..." : "Save Prompt"}
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Tabs value={activePromptTab} onValueChange={setActivePromptTab}>
          <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 h-auto">
            {promptTabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="0" className="mt-4">
            <div className="space-y-4">
              {prompt.map((message, index) => (
                <div key={index} className="rounded-md border p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Badge
                        variant={
                          message.role === "system"
                            ? "default"
                            : message.role === "user"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {message.role}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => removeMessage(index)}
                      disabled={prompt.length === 1}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive disabled:opacity-50"
                    >
                      Remove
                    </Button>
                  </div>
                  <Textarea
                    value={message.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>
              ))}

              <div className="flex gap-2">
                <Button
                  onClick={() => addMessage("system")}
                  variant="outline"
                  size="sm"
                >
                  Add System Message
                </Button>
                <Button
                  onClick={() => addMessage("user")}
                  variant="outline"
                  size="sm"
                >
                  Add User Message
                </Button>
                <Button
                  onClick={() => addMessage("assistant")}
                  variant="outline"
                  size="sm"
                >
                  Add Assistant Message
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="1" className="mt-4">
            <div className="rounded-md border p-4">
              <pre className="text-sm overflow-auto whitespace-pre-wrap">
                {JSON.stringify(prompt, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
