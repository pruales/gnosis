import { PromptTunerEditor } from "@/components/prompts/prompt-tuner-editor";
import { Message } from "@gnosis.dev/sdk";
import { getInstructionsPrompt } from "./actions";

export default async function PromptTunerPage() {
  let currentPrompt: Message[] = [];
  let errorMessage: string | null = null;

  try {
    currentPrompt = await getInstructionsPrompt();
  } catch (error) {
    console.error("Error fetching instructions prompt:", error);
    errorMessage = "Failed to load prompts. Please try again.";
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="w-full">
          <p className="text-body text-muted-foreground">
            Create and manage your AI prompts to retrieve memories
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-destructive">
          {errorMessage}
        </div>
      )}

      {currentPrompt.length > 0 && (
        <PromptTunerEditor initialPrompt={currentPrompt} />
      )}
    </>
  );
}
