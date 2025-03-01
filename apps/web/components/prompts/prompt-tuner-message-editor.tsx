"use client";

import { Textarea } from "@/components/ui/textarea";

interface InstructionPromptEditorProps {
  prompt: string;
  onUpdate: (updatedPrompt: string) => void;
}

export function PromptTunerMessageEditor({
  prompt,
  onUpdate,
}: InstructionPromptEditorProps) {
  const handlePromptChange = (content: string) => {
    onUpdate(content);
  };

  return (
    <div className="space-y-4">
      <Textarea
        value={prompt}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
          handlePromptChange(e.target.value)
        }
        placeholder="Enter your instruction prompt here..."
        rows={12}
      />
    </div>
  );
}
