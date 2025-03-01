"use server";

import { createAuthenticatedGnosisClient } from "@/lib/gnosis-client";
import { Message } from "@gnosis.dev/sdk";
import { revalidatePath } from "next/cache";

/**
 * Fetches the current instructions prompt
 */
export async function getInstructionsPrompt(): Promise<Message[]> {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.getInstructionsPrompt();

    console.log(response);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch instructions prompt");
    }
    const prompt = response.data.prompt;

    console.log(prompt);

    return prompt;
  } catch (error) {
    console.error("Error fetching instructions prompt:", error);
    throw error;
  }
}

/**
 * Updates the instructions prompt with new content
 */
export async function updateInstructionsPrompt(promptContent: Message[]) {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.setInstructionsPrompt(promptContent);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to update instructions prompt");
    }

    revalidatePath("/dashboard/prompt-tuner");
    return response.data;
  } catch (error) {
    console.error("Error updating instructions prompt:", error);
    throw error;
  }
}

/**
 * Resets the instructions prompt to the system default
 */
export async function resetInstructionsPrompt() {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.resetInstructionsPrompt();

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to reset instructions prompt");
    }

    revalidatePath("/dashboard/prompt-tuner");
    return response.data;
  } catch (error) {
    console.error("Error resetting instructions prompt:", error);
    throw error;
  }
}
