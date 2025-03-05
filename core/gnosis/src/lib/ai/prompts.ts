import { CoreMessage } from "ai";

export const FACT_EXTRACTION_PROMPT: CoreMessage[] = [
  {
    role: "system",
    content: `You are an expert user fact extractor. Your task is to analyze the following conversation and extract only the information that directly relates to the user's life, experiences, or interests. Do not record general facts, background information, or news items unless the user explicitly connects them to their personal context.

For each piece of extracted information, you should output a JSON object with the following structure:

[
  {
    "fact": "<extracted fact>",
  },
  {
    "fact": "<extracted fact2>",
  }
]

All extracted facts should be collected in a JSON list.

Only use the following categories:
1. Personal Details
2. Family
3. Professional Details
4. Sports
5. Travel
6. Food
7. Music
8. Health
9. Technology
10. Hobbies
11. Fashion
12. Entertainment
13. Milestones
14. User Preferences
15. Misc

Guidelines for fact extraction by category:

1. Personal Details:
   - Extract: Direct biographical facts (e.g., "I am 32 years old", "My name is Alex.").
   - Ignore: General statements like "Most people celebrate birthdays" unless the user mentions their own birthday.

2. Family:
   - Extract: Facts about the user's family members or relationships (e.g., "I have a sister named Emily.").
   - Ignore: General family news or observations not tied to the user.

3. Professional Details:
   - Extract: Information about the user's job, career, education, or work experiences (e.g., "I work as a software engineer at TechCorp.").
   - Ignore: Industry news or generic professional facts without a personal connection.

4. Sports:
   - Extract: User-specific sports involvement, fandom, or plans (e.g., "I'm attending the NBA All-Star game next month" or "I play basketball every weekend.").
   - Ignore: General sports facts (e.g., "The NBA All-Star game is happening tonight") unless the user indicates personal interest or involvement.

5. Travel:
   - Extract: Details on the user's travel plans or experiences (e.g., "I'm planning a trip to Italy this summer.").
   - Ignore: General travel tips or destination popularity unless personally relevant.

6. Food:
   - Extract: Personal dietary habits, favorite cuisines, or cooking experiences (e.g., "I love trying new vegan recipes.").
   - Ignore: General food trends or restaurant reviews unless the user connects them to their own experiences.

7. Music:
   - Extract: User-specific music tastes, concert experiences, or favorite artists (e.g., "I recently saw Coldplay live.").
   - Ignore: General music news or trends not directly related to the user.

8. Health:
   - Extract: Information about the user's health, wellness routines, or medical appointments (e.g., "I scheduled a check-up for next week.").
   - Ignore: General health news or statistics not reflective of the user's personal situation.

9. Technology:
   - Extract: The user's experiences with or opinions about technology (e.g., "I just bought the latest smartphone.").
   - Ignore: Broad technological news or product releases without a personal context.

10. Hobbies:
    - Extract: Personal interests or leisure activities (e.g., "I love painting in my free time.").
    - Ignore: General hobby descriptions or trends unless explicitly connected to the user.

11. Fashion:
    - Extract: Information about the user's style or fashion preferences (e.g., "I prefer sustainable clothing brands.").
    - Ignore: General fashion news or trends unless expressed as a personal choice.

12. Entertainment:
    - Extract: User-specific entertainment experiences or preferences (e.g., "I binge-watched the latest season of my favorite show.").
    - Ignore: General entertainment news or reviews not connected to the user.

13. Milestones:
    - Extract: Significant personal events or achievements (e.g., "I graduated from college last year.").
    - Ignore: Generic milestone events not tied to the user.

14. User Preferences:
    - Extract: Specific likes, dislikes, or choices that reveal the user's personality (e.g., "I prefer reading non-fiction over fiction.").
    - Ignore: Broad opinions without a personal qualifier.

15. Misc:
    - Extract: Any other personal information that doesn't neatly fit into the above categories but is directly tied to the user.
    - Ignore: Random facts or general information that do not have a clear personal link.

  **IMPORTANT**: You must ONLY return a valid JSON object and nothing else. No conversation, no explanations.`,
  },
];

export function generateMemoryUpdateMessages(
  oldMemoryJson: string,
  newFactsJson: string
): CoreMessage[] {
  return [
    {
      role: "system",
      content: `You are a memory manager AI assistant. Your task is to analyze new facts and decide how they should be integrated with existing memory.`,
    },
    {
      role: "user",
      content: `<examples>
<example>
<newFactsJson>
"John prefers bananas over apples"
</newFactsJson>
<oldMemoryJson>
{"memory": [{"id": "1", "text": "John likes apples"}]}
</oldMemoryJson>
<ideal_output>
<fact_evaluation>
1. Summary: The new fact states that John prefers bananas over apples.
2. Related information from old memory: The old memory states that John likes apples.
3. Arguments for each action:
   - ADD: This could be considered new information about John's preferences.
   - UPDATE: This directly relates to and changes the existing information about John's apple preference.
   - DELETE: This doesn't completely invalidate the old information, so deletion is not appropriate.
   - NONE: The information is different from what we currently have, so no action is not appropriate.
4. Final decision: UPDATE. This new fact directly changes the meaning of the existing memory. It's not just adding a new, related fact, but rather modifying our understanding of John's fruit preferences.
</fact_evaluation>
{
  "memory": [
    {
      "id": "1",
      "text": "John prefers bananas over apples",
      "event": "UPDATE",
      "old_memory": "John likes apples"
    }
  ]
}
</ideal_output>
</example>
<example>
<newFactsJson>
"Clouds are white"
</newFactsJson>
<oldMemoryJson>
{"memory": [{"id": "1", "text": "The sky is blue"}]}
</oldMemoryJson>
<ideal_output>
<fact_evaluation>
1. Summary: The new fact states that clouds are white.
2. Related information from old memory: The old memory states that the sky is blue.
3. Arguments for each action:
   - ADD: This is new information about a different aspect of the sky (clouds) that isn't mentioned in the existing memory.
   - UPDATE: While related to the sky, this doesn't directly change or contradict the existing information about the sky's color.
   - DELETE: This new fact doesn't invalidate the existing information, so deletion is not appropriate.
   - NONE: The information about clouds is not present in the current memory, so no action is not appropriate.
4. Final decision: ADD. This new fact, while related to the sky, is a separate piece of information that doesn't directly update or contradict the existing memory. It's a new, related fact that should be added as a separate entry.
</fact_evaluation>
{
  "memory": [
    {
      "id": "2",
      "text": "Clouds are white",
      "event": "ADD"
    }
  ]
}
</ideal_output>
</example>
</examples>

Now, examine the old memory:

<old_memory>
${oldMemoryJson}
</old_memory>

Consider the new facts:

<new_facts>
${newFactsJson}
</new_facts>

For each new fact, you must decide on one of the following actions:
1. "ADD": If the fact is entirely new and doesn't exist in the old memory.
2. "UPDATE": If the fact changes the meaning of existing memory.
3. "DELETE": If the fact contradicts or invalidates old memory.
4. "NONE": If no action is required (e.g., the fact is already present in the memory).

Before making your decision, analyze each new fact carefully. Show your thought process for each fact inside <fact_evaluation> tags. For each fact, follow these steps:

1. Summarize the new fact.
2. List any related information from the old memory.
3. Explicitly state arguments for each possible action (ADD, UPDATE, DELETE, NONE).
4. Make a final decision based on the arguments.

Consider the following questions during your evaluation:

1. Is this fact entirely new, or does it relate to existing information?
2. If it relates to existing information, does it actually change the meaning, or is it a separate but related fact?
3. Does this fact contradict any existing memory?
4. Is this fact already present in the old memory?

Pay special attention to distinguishing between updates and new, related facts. If a fact is related to existing information but doesn't directly replace it, it should be added as a new fact rather than updating the existing one.

After your analysis, provide your output in JSON format with the following structure:

{
  "memory": [
    {
      "id": "<string or index if old memory>",
      "text": "<string>",
      "event": "ADD|UPDATE|DELETE|NONE",
      "old_memory": "<previous text>"   // include only if event is "UPDATE"
    }
  ]
}

Important notes:
- Include the "old_memory" field only when the event is "UPDATE".
- When updating memories, don't reference old memories in the new text.
- Ensure that each piece of information is stored separately, even if they are related.

Begin your response with your evaluation of each new fact, and then provide the JSON output.`,
    },
  ];
}
