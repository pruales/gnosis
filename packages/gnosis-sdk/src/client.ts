import {
  ApiResponse,
  Memory,
  MemoryUpdate,
  Message,
  ListMemoriesOptions,
  PaginatedMemoriesResponse,
  CreateApiKeyResponse,
  ListApiKeysResponse,
  RevokeApiKeyResponse,
  GetInstructionsPromptResponse,
  PromptOperationResponse,
  MemoryOperationResponse,
  HealthCheckResponse,
  GnosisClientOptions,
  MemorySearchResult,
  GnosisAddResult,
} from "./types";

/**
 * API client for interacting with the Gnosis API
 *
 * @example
 * ```typescript
 * // Initialize the client with an API key
 * const client = new GnosisApiClient({
 *   apiKey: "your_api_key_here"
 * });
 *
 * // List memories
 * const memories = await client.listMemories({ limit: 10 });
 * ```
 */
export class GnosisApiClient {
  private baseUrl: string;
  private apiKey: string;
  private enableDebug: boolean;

  /**
   * Creates a new instance of the Gnosis API client
   *
   * @param options Configuration options for the client
   * @param options.apiKey API key for authentication
   * @param options.baseUrl Custom API URL (defaults to production API)
   * @param options.debug Enable debug logging
   */
  constructor(options: GnosisClientOptions) {
    this.baseUrl = options?.baseUrl || "https://api.gnosis.emergentlabs.dev";
    this.apiKey = options?.apiKey;
    this.enableDebug = options?.debug || false;
  }

  /**
   * Set the API key for authentication
   * @param apiKey The API key to use
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Enable or disable debug logging
   * @param enabled Whether debug logging should be enabled
   */
  setDebug(enabled: boolean): void {
    this.enableDebug = enabled;
  }

  /**
   * Helper method to build headers with authentication
   * @returns A record of HTTP headers
   */
  private async getHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    headers["Authorization"] = `Bearer ${this.apiKey}`;

    return headers;
  }

  /**
   * Generic request method with improved error handling
   * @param endpoint API endpoint to call
   * @param method HTTP method to use
   * @param body Optional request body
   * @returns ApiResponse with data or error
   */
  protected async request<T>(
    endpoint: string,
    method: string = "GET",
    body?: Record<string, unknown>
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const url = `${this.baseUrl}${endpoint}`;

      if (this.enableDebug) {
        console.log(`[API Request] ${method} ${url}`, body ? { body } : "");
      }

      const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });

      // Handle non-JSON response first (before trying to parse)
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        if (this.enableDebug) {
          console.error(
            `[API Error] Expected JSON but got ${
              contentType || "unknown content type"
            }`
          );
        }
        return {
          success: false,
          error: `Server returned non-JSON response: ${
            contentType || "unknown content type"
          }`,
        };
      }

      // Parse the JSON response
      let apiResponse: ApiResponse<T>;

      try {
        // Parse the response directly as an ApiResponse
        apiResponse = (await response.json()) as ApiResponse<T>;

        if (this.enableDebug) {
          console.log(
            `[API Response] ${method} ${url} - Status: ${response.status}`,
            apiResponse
          );
        }
      } catch (e) {
        if (this.enableDebug) {
          console.error(
            `[API Error] Failed to parse JSON from ${method} ${url}:`,
            e
          );

          // Try to get the raw text for debugging
          try {
            const rawText = await response.clone().text();
            console.error(
              `[API Error] Raw response: ${rawText.substring(0, 200)}`
            );
          } catch {
            console.error("[API Error] Could not get raw response text");
          }
        }

        return {
          success: false,
          error: `Failed to parse response as JSON: ${
            e instanceof Error ? e.message : String(e)
          }`,
        };
      }

      // If response status is not OK, ensure we return an error response
      if (!response.ok && apiResponse.success) {
        // This would be an inconsistency between HTTP status and response body
        if (this.enableDebug) {
          console.warn(
            `[API Warning] HTTP status ${response.status} but response indicates success`
          );
        }

        return {
          success: false,
          error: `Request failed with status ${response.status}: ${response.statusText}`,
        };
      }

      // Return the API response directly without wrapping it again
      return apiResponse;
    } catch (error) {
      if (this.enableDebug) {
        console.error(
          `[API Error] Unexpected error during ${method} ${endpoint}:`,
          error
        );
      }

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

  /**
   * Health check - ping the API to verify it's online
   *
   * @example
   * ```typescript
   * // Check if the API is available
   * const health = await client.ping();
   *
   * if (health.success) {
   *   console.log(`API status: ${health.data.status}`);
   * }
   * ```
   *
   * @returns Status of the API
   */
  async ping(): Promise<ApiResponse<HealthCheckResponse>> {
    return this.request<HealthCheckResponse>("/ping");
  }

  // =========================================
  // API Key endpoints
  // =========================================

  /**
   * List all API keys for the current company
   *
   * @example
   * ```typescript
   * // Get all API keys
   * const result = await client.listApiKeys();
   *
   * if (result.success) {
   *   console.log(`Found ${result.data.keys.length} API keys`);
   * }
   * ```
   *
   * @returns Promise resolving to list of API keys
   */
  async listApiKeys(): Promise<ApiResponse<ListApiKeysResponse>> {
    return this.request<ListApiKeysResponse>(`/api/v1/api_keys`);
  }

  /**
   * Create a new API key for the current company
   *
   * @example
   * ```typescript
   * // Create a new API key
   * const result = await client.createApiKey();
   *
   * if (result.success) {
   *   // Store this key securely - it won't be retrievable again
   *   console.log(`New API key: ${result.data.apiKey}`);
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Create a named API key
   * const result = await client.createApiKey("Development Key");
   *
   * if (result.success) {
   *   console.log(`New API key: ${result.data.apiKey}`);
   * }
   * ```
   *
   * @param name - Optional name for the API key
   * @returns Promise resolving to the newly created API key
   */
  async createApiKey(
    name?: string
  ): Promise<ApiResponse<CreateApiKeyResponse>> {
    const body: Record<string, string> = {};

    if (name) body.name = name;

    return this.request<CreateApiKeyResponse>(`/api/v1/api_keys`, "POST", body);
  }

  /**
   * Revoke a specific API key
   *
   * @example
   * ```typescript
   * // Revoke an API key
   * const result = await client.revokeApiKey("key_123456");
   *
   * if (result.success) {
   *   console.log("API key successfully revoked");
   * }
   * ```
   *
   * @param keyId - ID of the key to revoke
   * @returns Promise resolving to operation result
   */
  async revokeApiKey(
    keyId: string
  ): Promise<ApiResponse<RevokeApiKeyResponse>> {
    return this.request<RevokeApiKeyResponse>(
      `/api/v1/api_keys/${encodeURIComponent(keyId)}`,
      "DELETE"
    );
  }

  // =========================================
  // Prompt endpoints
  // =========================================

  /**
   * Get the current instructions prompt
   *
   * @example
   * ```typescript
   * // Get the current instructions prompt
   * const result = await client.getInstructionsPrompt();
   *
   * if (result.success) {
   *   console.log(`Prompt contains ${result.data.prompt.length} messages`);
   * }
   * ```
   *
   * @returns Promise resolving to the current instructions prompt
   */
  async getInstructionsPrompt(): Promise<
    ApiResponse<GetInstructionsPromptResponse>
  > {
    return this.request<GetInstructionsPromptResponse>(
      `/api/v1/prompts/instructions`
    );
  }

  /**
   * Set the instructions prompt to a new value
   *
   * @example
   * ```typescript
   * // Set a new instructions prompt
   * const result = await client.setInstructionsPrompt([
   *   { role: "system", content: "You are a helpful AI assistant." },
   *   { role: "user", content: "Tell me about machine learning." }
   * ]);
   *
   * if (result.success) {
   *   console.log("Instructions prompt updated successfully");
   * }
   * ```
   *
   * @param promptContent - The new prompt content as an array of messages
   * @returns Promise resolving to operation result
   */
  async setInstructionsPrompt(
    promptContent: Message[]
  ): Promise<ApiResponse<PromptOperationResponse>> {
    return this.request<PromptOperationResponse>(
      `/api/v1/prompts/instructions`,
      "POST",
      { promptContent }
    );
  }

  /**
   * Reset the instructions prompt to the system default
   *
   * @example
   * ```typescript
   * // Reset instructions prompt to default
   * const result = await client.resetInstructionsPrompt();
   *
   * if (result.success) {
   *   console.log("Instructions prompt reset to default");
   * }
   * ```
   *
   * @returns Promise resolving to operation result
   */
  async resetInstructionsPrompt(): Promise<
    ApiResponse<PromptOperationResponse>
  > {
    return this.request<PromptOperationResponse>(
      `/api/v1/prompts/instructions/reset`,
      "POST"
    );
  }

  // =========================================
  // Memory endpoints
  // =========================================

  /**
   * Add a new memory from messages
   *
   * @example
   * ```typescript
   * // Add a memory for a user from messages
   * const result = await client.addMemory("user123", [
   *   { role: "user", content: "My favorite color is blue" }
   * ]);
   * ```
   *
   * @param userId - The user ID to associate with the memory
   * @param messages - The messages to store as a memory
   * @returns Promise resolving to the result containing facts, reasoning and memory update operations
   */
  async addMemory(
    userId: string,
    messages: Message[]
  ): Promise<ApiResponse<GnosisAddResult>> {
    return this.request<GnosisAddResult>(`/api/v1/memories`, "POST", {
      userId,
      messages,
    });
  }

  /**
   * Get a memory by ID
   *
   * @example
   * ```typescript
   * // Retrieve a memory by ID
   * const result = await client.getMemory("mem_123456");
   *
   * if (result.success) {
   *   console.log(`Retrieved memory: ${result.data.text}`);
   * }
   * ```
   *
   * @param memoryId - ID of the memory to retrieve
   * @returns Promise resolving to the requested memory
   */
  async getMemory(memoryId: string): Promise<ApiResponse<Memory>> {
    return this.request<Memory>(
      `/api/v1/memories/${encodeURIComponent(memoryId)}`
    );
  }

  /**
   * List memories with optional filtering and bidirectional cursor-based pagination
   *
   * @example
   * ```typescript
   * // Get first page of all memories
   * const response = await client.listMemories();
   * ```
   *
   * @example
   * ```typescript
   * // Filter by userId with custom page size
   * const response = await client.listMemories({
   *   userId: "user_123",
   *   limit: 20
   * });
   * ```
   *
   * @example
   * ```typescript
   * // Forward pagination (next page) using starting_after
   * const page1 = await client.listMemories({ limit: 10 });
   * if (page1.success && page1.data.has_more) {
   *   const page2 = await client.listMemories({
   *     starting_after: page1.data.data[page1.data.data.length - 1].id
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Backward pagination (previous page) using ending_before
   * const initialPage = await client.listMemories({ limit: 10 });
   * if (initialPage.success && initialPage.data.data.length > 0) {
   *   // Get previous page
   *   const prevPage = await client.listMemories({
   *     ending_before: initialPage.data.data[0].id
   *   });
   * }
   * ```
   *
   * @param options - Options for filtering and pagination
   * @returns Promise with paginated memories response
   */
  async listMemories(
    options?: ListMemoriesOptions
  ): Promise<ApiResponse<PaginatedMemoriesResponse>> {
    const params = new URLSearchParams();

    if (options?.userId) params.append("userId", options.userId);
    if (options?.agentId) params.append("agentId", options.agentId);
    if (options?.limit) params.append("limit", options.limit.toString());

    // Bidirectional pagination support
    if (options?.starting_after && options?.ending_before) {
      throw new Error(
        "starting_after and ending_before parameters cannot be used simultaneously"
      );
    }

    if (options?.starting_after)
      params.append("starting_after", options.starting_after);
    if (options?.ending_before)
      params.append("ending_before", options.ending_before);

    const queryString = params.toString() ? `?${params.toString()}` : "";

    return this.request<PaginatedMemoriesResponse>(
      `/api/v1/memories/list${queryString}`
    );
  }

  /**
   * Search memories by query text
   *
   * @example
   * ```typescript
   * // Search memories for a specific user
   * const result = await client.searchMemories("project planning", "user_123");
   *
   * if (result.success) {
   *   // Process search results
   *   result.data.forEach(memory => {
   *     console.log(`${memory.id}: ${memory.text} (Score: ${memory.score})`);
   *   });
   * }
   * ```
   *
   * @param query - Text to search for
   * @param userId - User ID to filter memories by
   * @param limit - Maximum number of results to return (default: 100)
   * @returns Promise resolving to array of matching memories
   */
  async searchMemories(
    query: string,
    userId: string,
    limit: number = 100
  ): Promise<ApiResponse<MemorySearchResult[]>> {
    return this.request<MemorySearchResult[]>(
      `/api/v1/memories/search`,
      "POST",
      {
        query,
        userId,
        limit,
      }
    );
  }

  /**
   * Update a memory's text content
   *
   * @example
   * ```typescript
   * // Update a memory's content
   * const result = await client.updateMemory("mem_123456", "Updated memory text content");
   *
   * if (result.success) {
   *   console.log(result.data.message); // "Memory updated successfully"
   * }
   * ```
   *
   * @param memoryId - ID of the memory to update
   * @param text - New text for the memory
   * @returns Promise resolving to operation result
   */
  async updateMemory(
    memoryId: string,
    text: string
  ): Promise<ApiResponse<MemoryOperationResponse>> {
    return this.request<MemoryOperationResponse>(
      `/api/v1/memories/${encodeURIComponent(memoryId)}`,
      "PUT",
      { text }
    );
  }

  /**
   * Delete a memory
   *
   * @example
   * ```typescript
   * // Delete a memory by ID
   * const result = await client.deleteMemory("mem_123456");
   *
   * if (result.success) {
   *   console.log("Memory successfully deleted");
   * }
   * ```
   *
   * @param memoryId - ID of the memory to delete
   * @returns Promise resolving to operation result
   */
  async deleteMemory(
    memoryId: string
  ): Promise<ApiResponse<MemoryOperationResponse>> {
    return this.request<MemoryOperationResponse>(
      `/api/v1/memories/${encodeURIComponent(memoryId)}`,
      "DELETE"
    );
  }
}
