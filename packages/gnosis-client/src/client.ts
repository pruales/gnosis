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
    this.baseUrl = options?.baseUrl || "https://gnosis.emergentlabs.dev";
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

      let rawResponseText: string;

      try {
        // Clone the response for debugging
        const responseClone = response.clone();
        rawResponseText = await responseClone.text();

        if (this.enableDebug) {
          console.log(
            `[API Response] ${method} ${url} - Status: ${response.status}`,
            rawResponseText ? rawResponseText.substring(0, 300) : "No content"
          );
        }
      } catch (e) {
        rawResponseText = "";
        if (this.enableDebug) {
          console.error("Error cloning response for debugging:", e);
        }
      }

      // Try to parse the response as JSON
      let data: Record<string, unknown>;
      try {
        // Use the raw text to parse JSON instead of response.json()
        data = rawResponseText ? JSON.parse(rawResponseText) : {};
      } catch (e) {
        if (this.enableDebug) {
          console.error(
            `[API Error] Failed to parse JSON from ${method} ${url}:`,
            e
          );
          console.error(`[API Error] Raw response: ${rawResponseText}`);
        }

        // Handle case where response isn't valid JSON
        return {
          success: false,
          error: `Failed to parse response as JSON: ${
            e instanceof Error ? e.message : String(e)
          }${
            rawResponseText
              ? `. Raw response: ${rawResponseText.substring(0, 100)}...`
              : ""
          }`,
        };
      }

      if (!response.ok) {
        if (this.enableDebug) {
          console.error(
            `[API Error] ${method} ${url} - Status: ${response.status}`,
            data
          );
        }

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
   * @returns Promise resolving to the newly created API key
   */
  async createApiKey(): Promise<ApiResponse<CreateApiKeyResponse>> {
    return this.request<CreateApiKeyResponse>(`/api/v1/api_keys`, "POST");
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
   * Add a new memory
   *
   * @example
   * ```typescript
   * // Add a memory with user messages
   * const result = await client.addMemory("user123", [
   *   { role: "user", content: "What is machine learning?" },
   *   { role: "assistant", content: "Machine learning is a branch of AI..." }
   * ]);
   *
   * if (result.success) {
   *   // Memory added successfully
   *   console.log(`Added new memory with ID: ${result.data[0].id}`);
   * }
   * ```
   *
   * @param userId - The user ID to associate with the memory
   * @param messages - The messages to store as a memory
   * @returns Promise resolving to memory update operations
   */
  async addMemory(
    userId: string,
    messages: Message[]
  ): Promise<ApiResponse<MemoryUpdate[]>> {
    return this.request<MemoryUpdate[]>(`/api/v1/memories`, "POST", {
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
   * List memories with optional filtering and cursor-based pagination
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
   * // Get next page using cursor
   * const page1 = await client.listMemories({ limit: 10 });
   * if (page1.success && page1.data.pagination.has_more) {
   *   const page2 = await client.listMemories({
   *     cursor: page1.data.pagination.next_cursor
   *   });
   * }
   * ```
   *
   * @example
   * ```typescript
   * // Combined filtering with total count
   * const response = await client.listMemories({
   *   userId: "user_123",
   *   agentId: "agent_456",
   *   includeTotal: true
   * });
   *
   * if (response.success) {
   *   console.log(`Total records: ${response.data.pagination.total}`);
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
    if (options?.cursor) params.append("cursor", options.cursor);
    if (options?.includeTotal) params.append("include_total", "true");

    const queryString = params.toString() ? `?${params.toString()}` : "";

    return this.request<PaginatedMemoriesResponse>(
      `/api/v1/memories/list${queryString}`
    );
  }

  /**
   * Search memories based on query text
   *
   * @example
   * ```typescript
   * // Search for memories containing specific text
   * const result = await client.searchMemories("machine learning", "user_123");
   *
   * if (result.success) {
   *   console.log(`Found ${result.data.length} matching memories`);
   * }
   * ```
   *
   * @param query - Search query text
   * @param userId - User ID to filter memories by
   * @param limit - Maximum number of results to return (default: 100)
   * @returns Promise resolving to matching memories
   */
  async searchMemories(
    query: string,
    userId: string,
    limit: number = 100
  ): Promise<ApiResponse<Memory[]>> {
    return this.request<Memory[]>(`/api/v1/memories/search`, "POST", {
      query,
      userId,
      limit,
    });
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
