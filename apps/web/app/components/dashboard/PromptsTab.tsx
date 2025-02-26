import { useState } from "react";
import { FetcherWithComponents, useSearchParams } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "~/components/ui/tabs";
import { Badge } from "~/components/ui/badge";
import { Sparkles, Save, Plus, Trash2, RotateCcw } from "lucide-react";
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
import { Card, CardContent } from "~/components/ui/card";

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
  isFallbackData?: boolean;
};

export function PromptsTab({ initialPromptContent, fetcher }: PromptsTabProps) {
  const [prompt, setPrompt] = useState<PromptMessage[]>(
    initialPromptContent || []
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  // Get active tab from URL or default to "edit"
  const activePromptTab = searchParams.get("promptTab") || "edit";

  // Handle tab change
  const handleTabChange = (value: string) => {
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set("promptTab", value);
    setSearchParams(newSearchParams, {
      preventScrollReset: true,
      replace: true,
    });
  };

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
        content: "",
      },
    ]);
    setIsResetDialogOpen(false);
  };

  const isSavingPrompt =
    fetcher.state !== "idle" &&
    fetcher.formData?.get("action") === "save_prompt";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center pb-6 border-b">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Fact Extraction Prompt
          </h2>
          <p className="text-sm text-muted-foreground">
            Configure the prompt that Gnosis uses for fact extraction
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AlertDialog
            open={isResetDialogOpen}
            onOpenChange={setIsResetDialogOpen}
          >
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground hover:border-destructive"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Default
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset Prompt</AlertDialogTitle>
                <AlertDialogDescription>
                  This will reset the prompt to the default settings and discard
                  all your changes. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={resetPrompt}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Reset
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button
            onClick={savePrompt}
            disabled={isSavingPrompt}
            size="sm"
            className="gap-2 transition-all duration-200 hover:scale-[1.02]"
          >
            {isSavingPrompt ? (
              <>
                <RotateCcw className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Prompt
              </>
            )}
          </Button>
        </div>
      </div>

      <Card className="border shadow-sm">
        <Tabs value={activePromptTab} onValueChange={handleTabChange}>
          <TabsList className="w-full justify-start rounded-none bg-transparent border-b h-auto p-0">
            <TabsTrigger
              value="edit"
              className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200"
            >
              Edit Messages
            </TabsTrigger>
            <TabsTrigger
              value="json"
              className="rounded-none border-b-2 border-transparent px-4 py-3 font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none transition-all duration-200"
            >
              JSON View
            </TabsTrigger>
          </TabsList>

          <CardContent className="p-4">
            <TabsContent value="edit" className="mt-4 space-y-4">
              {prompt.map((message, index) => (
                <div
                  key={index}
                  className="rounded-md border p-4 bg-card shadow-sm transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <Badge
                        variant={
                          message.role === "system"
                            ? "default"
                            : message.role === "user"
                            ? "secondary"
                            : "outline"
                        }
                        className="capitalize transition-all"
                      >
                        {message.role}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => removeMessage(index)}
                      disabled={prompt.length === 1}
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 disabled:opacity-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <Textarea
                    value={message.content}
                    onChange={(e) => handleContentChange(index, e.target.value)}
                    className="min-h-[100px] focus:border-primary transition-colors"
                    placeholder={`Enter ${message.role} message...`}
                  />
                </div>
              ))}

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => addMessage("system")}
                  variant="outline"
                  size="sm"
                  className="gap-1 transition-all duration-200 hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  System Message
                </Button>
                <Button
                  onClick={() => addMessage("user")}
                  variant="outline"
                  size="sm"
                  className="gap-1 transition-all duration-200 hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  User Message
                </Button>
                <Button
                  onClick={() => addMessage("assistant")}
                  variant="outline"
                  size="sm"
                  className="gap-1 transition-all duration-200 hover:border-primary hover:text-primary"
                >
                  <Plus className="h-4 w-4" />
                  Assistant Message
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="json" className="mt-4">
              <div className="rounded-md border bg-muted/30 p-4 font-mono text-sm">
                <pre className="overflow-auto whitespace-pre-wrap">
                  {JSON.stringify(prompt, null, 2)}
                </pre>
              </div>
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
}
