import { getAuth } from "@clerk/remix/ssr.server";
import type { DataFunctionArgs } from "@remix-run/cloudflare";

// Define base types for API responses
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// API client for interacting with the Gnosis API
export class GnosisApiClient {
  private baseUrl: string;
  private apiKey?: string;
  private userId?: string;
  private getSessionToken?: () => Promise<string | null | undefined>;

  constructor(
    baseUrl: string,
    options?: {
      apiKey?: string;
      userId?: string;
      getSessionToken?: () => Promise<string | null | undefined>;
    }
  ) {
    this.baseUrl = baseUrl;
    this.apiKey = options?.apiKey;
    this.userId = options?.userId;
    this.getSessionToken = options?.getSessionToken;
  }

  // Set the API key
  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Set the user ID
  setUserId(userId: string) {
    this.userId = userId;
  }

  // Set the session token getter function
  setSessionTokenGetter(getter: () => Promise<string | null | undefined>) {
    this.getSessionToken = getter;
  }

  // Helper method to build headers with authentication
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Try to get a fresh session token if the getter is available
    if (this.getSessionToken) {
      try {
        const sessionToken = await this.getSessionToken();
        if (sessionToken) {
          headers["Authorization"] = `Bearer ${sessionToken}`;
          return headers;
        }
      } catch (error) {
        console.error("Error getting session token:", error);
        // Fall back to API key if session token retrieval fails
      }
    }

    // Fall back to API key authentication if no session token is available
    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
      // Only include X-User-ID when using API key auth
      if (this.userId) {
        headers["X-User-ID"] = this.userId;
      }
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = (await response.json()) as Record<string, unknown>;

      if (!response.ok) {
        return {
          success: false,
          error:
            (data.error as string) ||
            `Request failed with status ${response.status}`,
        };
      }

      return {
        success: true,
        data: data as unknown as T,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  // API methods for different endpoints
  async getApiKeys() {
    return this.request<{
      keys: Array<{ id: string; createdAt: string; revoked: boolean }>;
    }>("/api/keys");
  }

  async createApiKey() {
    return this.request<{ key: string }>("/api/keys", "POST");
  }

  async revokeApiKey(keyId: string) {
    return this.request<void>(`/api/keys/${keyId}`, "DELETE");
  }

  async getPrompts() {
    return this.request<{
      prompts: Array<{ id: string; name: string; content: string }>;
    }>("/api/prompts");
  }

  async createPrompt(name: string, content: string) {
    return this.request<{ id: string }>("/api/prompts", "POST", {
      name,
      content,
    });
  }

  async updatePrompt(id: string, name: string, content: string) {
    return this.request<void>(`/api/prompts/${id}`, "PUT", { name, content });
  }

  async deletePrompt(id: string) {
    return this.request<void>(`/api/prompts/${id}`, "DELETE");
  }
}

// Create a singleton instance for use throughout the app
const API_BASE_URL =
  process.env.API_BASE_URL || "https://api.gnosis.example.com";
export const gnosisApi = new GnosisApiClient(API_BASE_URL);

// Helper to get an authenticated API client in loaders/actions
export async function getAuthenticatedApi(args: DataFunctionArgs) {
  const { userId, getToken } = await getAuth(args);

  const api = new GnosisApiClient(API_BASE_URL, {
    userId: userId || undefined,
    // Pass the token getter function instead of the token itself
    getSessionToken: getToken ? async () => await getToken() : undefined,
  });

  return api;
}
