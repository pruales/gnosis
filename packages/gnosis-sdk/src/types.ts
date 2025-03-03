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
  name?: string;
  creator?: string;
};

/**
 * Response when creating a new API key
 */
export interface CreateApiKeyResponse {
  /**
   * The API key value - store securely as it won't be retrievable again
   */
  apiKey: string;

  /**
   * The ID of the newly created API key
   */
  apiKeyId: string;
}

/**
 * Response when listing API keys
 */
export interface ListApiKeysResponse {
  /**
   * Array of API keys
   */
  keys: ApiKey[];
}

/**
 * Response when revoking an API key
 */
export interface RevokeApiKeyResponse {
  /**
   * Confirmation message
   */
  message: string;
}

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

/**
 * Response from getting the instructions prompt
 */
export interface GetInstructionsPromptResponse {
  /**
   * Array of message objects that make up the prompt
   */
  prompt: Message[];
}

/**
 * Request body for setting a new instructions prompt
 */
export interface SetInstructionsPromptRequest {
  /**
   * Array of message objects that make up the new prompt
   */
  promptContent: Message[];
}

/**
 * Response when setting or resetting a prompt
 */
export interface PromptOperationResponse {
  /**
   * Confirmation message
   */
  message: string;
}

// Memory types
export type Memory = {
  id: string;
  text: string;
  metadata: {
    userId: string;
    memoryText: string;
    orgId?: string;
    agentId?: string;
  };
  namespace: string;
  score?: number;
};

/**
 * Request for adding a new memory
 */
export interface AddMemoryRequest {
  /**
   * User ID to associate with the memory
   */
  userId: string;

  /**
   * Array of message objects to store as memory
   */
  messages: Message[];
}

// Memory update types - Updated to match the actual API response format
export type MemoryUpdate =
  | {
      type: "ADD";
      text: string;
      id: string;
    }
  | {
      type: "UPDATE";
      id: string;
      oldText: string | undefined;
      newText: string;
    }
  | {
      type: "DELETE";
      id: string;
    };

/**
 * Request for updating a memory
 */
export interface UpdateMemoryRequest {
  /**
   * New text content for the memory
   */
  text: string;
}

/**
 * Response when updating or deleting a memory
 */
export interface MemoryOperationResponse {
  /**
   * Confirmation message
   */
  message: string;
}

/**
 * Request for searching memories
 */
export interface SearchMemoriesRequest {
  /**
   * Search query text
   */
  query: string;

  /**
   * User ID to filter memories by
   */
  userId: string;

  /**
   * Maximum number of results to return (default: 100)
   */
  limit?: number;
}

// Company type
export type Company = {
  id: string;
  name: string;
};

/**
 * Options for filtering and paginating memory list requests
 */
export interface ListMemoriesOptions {
  /**
   * Filter memories by user ID
   */
  userId?: string;

  /**
   * Filter memories by agent ID
   */
  agentId?: string;

  /**
   * Maximum number of results to return (default: 50)
   */
  limit?: number;

  /**
   * Cursor for pagination (memory ID to start after)
   */
  cursor?: string;

  /**
   * Whether to include total count (expensive for large datasets)
   */
  includeTotal?: boolean;
}

/**
 * Pagination metadata returned by the API
 */
export interface PaginationMeta {
  /**
   * Whether there are more results available
   */
  has_more: boolean;

  /**
   * ID of the last memory in the current page, use as cursor for next page
   */
  next_cursor: string | null;

  /**
   * Maximum number of results returned per page
   */
  limit: number;

  /**
   * Total number of memories matching the filter (only present if includeTotal was true)
   */
  total?: number;
}

/**
 * Response structure for paginated memories list
 */
export interface PaginatedMemoriesResponse {
  /**
   * Array of memory objects
   */
  data: Memory[];

  /**
   * Pagination metadata
   */
  pagination: PaginationMeta;
}

/**
 * API Client configuration options
 */
export interface GnosisClientOptions {
  /**
   * Base URL for the API (defaults to "https://gnosis.emergentlabs.dev")
   */
  baseUrl?: string;

  /**
   * API key for authentication
   */
  apiKey: string;

  /**
   * Enable debug logging (defaults to false)
   */
  debug?: boolean;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  /**
   * Status of the API server
   */
  status: string;
}
