export const FACT_EXTRACTION_PROMPT = `
You are a memory extraction AI. Given the user/assistant messages, 
extract relevant facts in JSON form:

{"facts": ["Fact 1", "Fact 2", ...]}

Only return the JSON with key "facts".
`;

export function memoryUpdatePrompt(
  oldMemoryJson: string,
  newFactsJson: string
): string {
  return `
You are a memory manager. The old memory is:

${oldMemoryJson}

New facts are:

${newFactsJson}

For each new fact, decide if we:
- "ADD"
- "UPDATE" (if it changes the meaning of existing memory)
- "DELETE" (if it contradicts or invalidates old memory)
- "NONE"

Return JSON with format:
{
  "memory": [
    {
      "id": "<string or index if old memory>",
      "text": "<string>",
      "event": "ADD|UPDATE|DELETE|NONE",
      "old_memory": "<previous text>"   // if UPDATE
    }
  ]
}
`;
}
