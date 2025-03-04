"use server";

import { createAuthenticatedGnosisClient } from "@/lib/gnosis-client";
import { PaginatedMemoriesResponse } from "@gnosis.dev/sdk";

export interface MemoriesFilter {
  userId?: string;
  agentId?: string;
  starting_after?: string;
  ending_before?: string;
  limit?: number;
}

export async function getMemories({
  userId,
  agentId,
  starting_after,
  ending_before,
  limit,
}: MemoriesFilter = {}): Promise<PaginatedMemoriesResponse> {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.listMemories({
      userId,
      agentId,
      starting_after,
      ending_before,
      limit,
    });

    const data = response.data;
    if (!data) {
      return {
        data: [],
        has_more: false,
      };
    }
    return data;
  } catch (error) {
    console.error("Error fetching memories:", error);
    return {
      data: [],
      has_more: false,
    };
  }
}

export async function deleteMemory(memoryId: string) {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.deleteMemory(memoryId);

    return { success: response.success };
  } catch (error) {
    console.error("Error deleting memory:", error);
    return { success: false, error: "Failed to delete memory" };
  }
}

export async function updateMemory(memoryId: string, text: string) {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.updateMemory(memoryId, text);

    return { success: response.success };
  } catch (error) {
    console.error("Error updating memory:", error);
    return { success: false, error: "Failed to update memory" };
  }
}
