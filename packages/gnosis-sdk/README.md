# Gnosis SDK

A TypeScript SDK for interacting with the Gnosis API, featuring a clean, intuitive design.

## Installation

```bash
# npm
npm install @gnosis.dev/sdk

# yarn
yarn add @gnosis.dev/sdk

# pnpm
pnpm add @gnosis.dev/sdk

# bun
bun add @gnosis.dev/sdk
```

## Usage

### Initializing the Client

```typescript
import { GnosisApiClient } from "@gnosis.dev/sdk";

// Initialize with API key
const client = new GnosisApiClient({
  apiKey: "your-api-key-here",
});

// Optional configuration
const client = new GnosisApiClient({
  baseUrl: "https://your-custom-api.example.com", // Default: https://gnosis.emergentlabs.dev
  apiKey: "your-api-key-here",
  debug: true, // Enable debug logging
});
```

### API Structure

The client provides a simple, flat API structure with methods directly on the client object:

```typescript
// Memory operations
const memory = await client.getMemory("memory_123");

// Prompt operations
const prompt = await client.getInstructionsPrompt();
```

### Response Handling

All methods return a consistent `ApiResponse` type with success status and typed data:

```typescript
const result = await client.listMemories({ limit: 10 });

if (result.success) {
  // TypeScript knows exactly what's in result.data
  const memories = result.data.data;
  const pagination = result.data.pagination;

  console.log(`Found ${memories.length} memories`);
  console.log(`Has more: ${pagination.has_more}`);

  if (pagination.has_more) {
    // Get next page
    const nextPage = await client.listMemories({
      cursor: pagination.next_cursor,
    });
  }
} else {
  console.error(`Error: ${result.error}`);
}
```

## API Methods

### Health Check

```typescript
// Check if the API is available
const health = await client.ping();
if (health.success) {
  console.log(`API is online with status: ${health.data.status}`);
}
```

### API Key Methods

```typescript
// List all API keys
const keys = await client.listApiKeys();

// Create a new API key
const newKey = await client.createApiKey();
if (newKey.success) {
  // Store this key securely - it won't be retrievable again
  console.log(`API Key: ${newKey.data.apiKey}`);
}

// Create a new API key with a name
const namedKey = await client.createApiKey("Development Key");

// Revoke an API key
const revoked = await client.revokeApiKey("key_123");
```

### Prompt Methods

```typescript
// Get the current instructions prompt
const prompt = await client.getInstructionsPrompt();

// Set a new instructions prompt
const updated = await client.setInstructionsPrompt([
  { role: "system", content: "You are a helpful AI assistant." },
  { role: "user", content: "Tell me about machine learning." },
]);

// Reset instructions to default
const reset = await client.resetInstructionsPrompt();
```

### Memory Methods

```typescript
// List memories with optional filtering and pagination
const memories = await client.listMemories({
  userId: "user_123", // Optional: Filter by user ID
  agentId: "agent_456", // Optional: Filter by agent ID
  limit: 20, // Optional: Limit results per page (default: 50)
  cursor: "mem_789", // Optional: Cursor for pagination
  includeTotal: true, // Optional: Include total count (default: false)
});

// Get a single memory by ID
const memory = await client.getMemory("memory_123");

// Add a new memory
const newMemory = await client.addMemory("user_123", [
  { role: "user", content: "What is machine learning?" },
  { role: "assistant", content: "Machine learning is a branch of AI..." },
]);

// Update a memory
const updated = await client.updateMemory("memory_123", "Updated text content");

// Delete a memory
const deleted = await client.deleteMemory("memory_123");

// Search memories
const searchResults = await client.searchMemories(
  "machine learning", // Search query
  "user_123", // User ID to filter by
  50 // Optional: Maximum results to return (default: 100)
);
```

## Advanced Usage

### Client Configuration

```typescript
// Set API key after initialization
client.setApiKey("your-new-api-key");

// Enable/disable debug logging
client.setDebug(true);
```

### Pagination

The client uses cursor-based pagination for list endpoints:

```typescript
// Initial request
const page1 = await client.listMemories({ limit: 10 });

// Check if there are more pages
if (page1.success && page1.data.pagination.has_more) {
  // Get the next page using the cursor
  const page2 = await client.listMemories({
    cursor: page1.data.pagination.next_cursor,
  });
}
```

### Error Handling

All methods provide consistent error handling:

```typescript
try {
  const result = await client.getMemory("non_existent_id");

  if (!result.success) {
    // API returned an error response
    console.error(`API Error: ${result.error}`);
    // Handle specific error cases
    if (result.error.includes("not found")) {
      // Handle not found case
    }
  } else {
    // Success path
    console.log(result.data);
  }
} catch (e) {
  // Network errors or unexpected issues
  console.error("Unexpected error:", e);
}
```

## TypeScript Support

This SDK is built with TypeScript and includes comprehensive type definitions:

```typescript
import { GnosisApiClient, Memory, ApiResponse } from "@gnosis.dev/sdk";

// All types are exported for use in your application
function processMemories(memories: Memory[]) {
  // Work with strongly-typed data
}

// Response types are properly generified
async function fetchAndProcess(): Promise<void> {
  const response: ApiResponse<Memory> = await client.getMemory("mem_123");
  // TypeScript knows the shape of response.data if successful
}
```

## Key Types

The SDK exports the following important types:

```typescript
// API response wrapper
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Message type for conversations
type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Memory type
type Memory = {
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

// List memories options
interface ListMemoriesOptions {
  userId?: string;
  agentId?: string;
  limit?: number;
  cursor?: string;
  includeTotal?: boolean;
}
```

## License

MIT
