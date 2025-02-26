import { getAuth } from "@clerk/remix/ssr.server";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs,
} from "@remix-run/cloudflare";

// Define base types for API responses
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// API key types
export type ApiKey = {
  id: string;
  createdAt: string;
  revoked: boolean;
};

// Prompt types
export type Prompt = {
  id: string;
  name: string;
  content: string;
};

// Message type for chat conversations and prompts
export type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Memory types
export type Memory = {
  id: string;
  text: string;
  metadata: {
    userId: string;
    memoryText: string;
  };
  namespace: string;
  score?: number;
};

// Memory update types
export type MemoryUpdate = {
  type: "ADD" | "UPDATE" | "DELETE";
  id?: string;
  text?: string;
  oldText?: string;
  newText?: string;
};

// Company type
export type Company = {
  id: string;
  name: string;
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

  // Generic request method with improved error handling
  private async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseUrl}${endpoint}`;

      console.log(`[API Request] ${method} ${url}`, body ? { body } : "");

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Clone the response for debugging
      const responseClone = response.clone();
      const rawResponseText = await responseClone.text();

      // More detailed logging with status code
      console.log(
        `[API Response] ${method} ${url} - Status: ${response.status}`,
        rawResponseText ? rawResponseText.substring(0, 300) : "No content"
      );

      // Try to parse the response as JSON
      let data: Record<string, unknown>;
      try {
        // Use the raw text to parse JSON instead of response.json()
        data = rawResponseText ? JSON.parse(rawResponseText) : {};
      } catch (e) {
        console.error(
          `[API Error] Failed to parse JSON from ${method} ${url}:`,
          e
        );
        console.error(`[API Error] Raw response: ${rawResponseText}`);
        // Handle case where response isn't valid JSON
        return {
          success: false,
          error: `Failed to parse response as JSON: ${
            e instanceof Error ? e.message : String(e)
          }. Raw response: ${rawResponseText.substring(0, 100)}...`,
        };
      }

      if (!response.ok) {
        console.error(
          `[API Error] ${method} ${url} - Status: ${response.status}`,
          data
        );
        return {
          success: false,
          error:
            (data.error as string) ||
            `Request failed with status ${response.status}: ${response.statusText}`,
        };
      }

      return {
        success: true,
        data: data as unknown as T,
      };
    } catch (error) {
      console.error(
        `[API Error] Unexpected error during ${method} ${endpoint}:`,
        error
      );
      return {
        success: false,
        error:
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : "Unknown error occurred",
      };
    }
  }

  // =========================================
  // Health endpoints
  // =========================================

  // Health check - root endpoint
  async ping() {
    return this.request<{ status: string }>("/ping");
  }

  // Health check - API endpoint
  async pingApi() {
    return this.request<{ status: string }>("/api/v1/ping");
  }

  // =========================================
  // Company endpoints
  // =========================================

  // Create a new company (admin only)
  async createCompany(name: string) {
    return this.request<{ id: string; name: string; apiKey: string }>(
      "/api/v1/companies",
      "POST",
      { name }
    );
  }

  // =========================================
  // API Key endpoints
  // =========================================

  // Get API keys for the current company
  async getApiKeys() {
    return this.request<{ keys: ApiKey[] }>("/api/v1/companies/api-keys");
  }

  // Create a new API key for the current company
  async createApiKey() {
    console.log("[API] Creating API key for the authenticated company");

    // Use the direct endpoint for creating an API key for the authenticated user's company
    return this.request<{ apiKey: string }>(
      `/api/v1/companies/api-keys`,
      "POST"
    );
  }

  // Revoke a specific API key for the current company
  async revokeApiKey(keyId: string) {
    return this.request<{ message: string }>(
      `/api/v1/companies/api-keys/${keyId}`,
      "DELETE"
    );
  }

  // Create a new API key for a specific company
  async createCompanyApiKey(companyId: string) {
    return this.request<{ apiKey: string }>(
      `/api/v1/companies/${companyId}/api-keys`,
      "POST"
    );
  }

  // Revoke all API keys for a specific company
  async revokeAllCompanyApiKeys(companyId: string) {
    return this.request<{ message: string; revokedCount: number }>(
      `/api/v1/companies/${companyId}/api-keys`,
      "DELETE"
    );
  }

  // =========================================
  // Legacy Prompt endpoints
  // =========================================

  // These endpoints may be deprecated but are maintained for backward compatibility

  async getPrompts() {
    return this.request<{ prompts: Prompt[] }>("/api/prompts");
  }

  async createPrompt(name: string, content: string) {
    return this.request<{ id: string }>("/api/prompts", "POST", {
      name,
      content,
    });
  }

  async updatePrompt(id: string, name: string, content: string) {
    return this.request<void>(`/api/prompts/${id}`, "PUT", {
      name,
      content,
    });
  }

  async deletePrompt(id: string) {
    return this.request<void>(`/api/prompts/${id}`, "DELETE");
  }

  // =========================================
  // Fact Extraction Prompt endpoints
  // =========================================

  // Get the fact extraction prompt for a company
  async getFactExtractionPrompt(companyId: string) {
    return this.request<{ prompt: Message[] }>(
      `/api/v1/companies/${companyId}/prompt`
    );
  }

  // Set the fact extraction prompt for a company
  async setFactExtractionPrompt(companyId: string, promptContent: Message[]) {
    return this.request<{ message: string }>(
      `/api/v1/companies/${companyId}/prompt`,
      "POST",
      { promptContent }
    );
  }

  // =========================================
  // Memory endpoints
  // =========================================

  // Add a new memory
  async addMemory(userId: string, messages: Message[], namespace: string) {
    return this.request<MemoryUpdate[]>("/api/v1/memories", "POST", {
      messages,
      userId,
      namespace,
    });
  }

  // Get a memory by ID
  async getMemory(memoryId: string) {
    return this.request<Memory>(`/api/v1/memories/${memoryId}`);
  }

  // Search memories
  // This method maps to functionality in the Gnosis class
  async searchMemories(
    query: string,
    userId: string,
    namespace: string,
    limit: number = 100
  ) {
    return this.request<Memory[]>("/api/v1/memories/search", "POST", {
      query,
      userId,
      namespace,
      limit,
    });
  }

  // Update a memory
  // This method maps to functionality in the Gnosis class
  async updateMemory(memoryId: string, text: string) {
    return this.request<{ message: string }>(
      `/api/v1/memories/${memoryId}`,
      "PUT",
      {
        text,
      }
    );
  }

  // Delete a memory
  // This method maps to functionality in the Gnosis class
  async deleteMemory(memoryId: string) {
    return this.request<{ message: string }>(
      `/api/v1/memories/${memoryId}`,
      "DELETE"
    );
  }

  // =========================================
  // Utility methods
  // =========================================

  // No client-side utility methods needed - organization ID is handled by Clerk session token
}

// Create a singleton instance for use throughout the app
const API_BASE_URL =
  typeof process !== "undefined" && process.env.API_BASE_URL
    ? process.env.API_BASE_URL
    : "http://localhost:8787";

export const gnosisApi = new GnosisApiClient(API_BASE_URL);

// Helper to get an authenticated API client in loaders/actions
export async function getAuthenticatedApi(
  args: LoaderFunctionArgs | ActionFunctionArgs
) {
  const { userId, getToken } = await getAuth(args);

  const api = new GnosisApiClient(API_BASE_URL, {
    userId: userId || undefined,
    // Pass the token getter function instead of the token itself
    getSessionToken: getToken ? async () => await getToken() : undefined,
  });

  return api;
}
