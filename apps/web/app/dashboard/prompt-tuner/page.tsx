import { toast } from "sonner";
import { getInstructionsPrompt } from "./actions";
import { PromptTunerEditor } from "@/components/prompts/prompt-tuner-editor";
import { Message } from "gnosis-client";

export default async function PromptTunerPage() {
  let currentPrompt: Message[] = [];
  try {
    currentPrompt = await getInstructionsPrompt();
  } catch (error) {
    console.error("Error fetching instructions prompt:", error);
    toast.error("Error fetching instructions prompt");
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

      {currentPrompt.length > 0 && (
        <PromptTunerEditor initialPrompt={currentPrompt} />
      )}
    </>
  );
}
