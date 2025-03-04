"use server";

import { createAuthenticatedGnosisClient } from "@/lib/gnosis-client";
import { ApiKey } from "@gnosis.dev/sdk";
import { revalidatePath } from "next/cache";

/**
 * Fetches all API keys for the current company
 */
export async function getApiKeys(): Promise<ApiKey[]> {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.listApiKeys();

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch API keys");
    }

    return response.data.keys.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (error) {
    console.error("Error fetching API keys:", error);
    throw error;
  }
}

/**
 * Creates a new API key with optional name
 * Returns the API key value which needs to be saved immediately
 */
export async function createApiKey(name?: string): Promise<{ apiKey: string }> {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.createApiKey(name);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to create API key");
    }

    revalidatePath("/dashboard/api-keys");
    return response.data;
  } catch (error) {
    console.error("Error creating API key:", error);
    throw error;
  }
}

/**
 * Revokes an API key by ID
 */
export async function revokeApiKey(keyId: string): Promise<void> {
  try {
    const client = await createAuthenticatedGnosisClient();
    const response = await client.revokeApiKey(keyId);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to revoke API key");
    }

    revalidatePath("/dashboard/api-keys");
  } catch (error) {
    console.error("Error revoking API key:", error);
    throw error;
  }
}
