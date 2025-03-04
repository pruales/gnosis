# Gnosis SDK

A lightweight TypeScript SDK for the Gnosis API.

## Getting Started

Drop it into your project:

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

## Quick Start

### Setting Up

```typescript
import { GnosisApiClient } from "@gnosis.dev/sdk";

const client = new GnosisApiClient({
  apiKey: "your-api-key-here",
});
```

## Working with Memories

### Pagination

The SDK supports Stripe-style bidirectional cursor pagination for listing memories, allowing you to efficiently navigate large datasets in both forward and backward directions.

#### Forward Pagination (Next Pages)

To get the next page of results, use the `next` cursor from the pagination metadata:

```typescript
// Get the first page
const page1 = await client.listMemories({ limit: 10 });

// Check if there are more results
if (page1.success && page1.data.pagination.has_more) {
  // Get the next page using the 'next' cursor
  const page2 = await client.listMemories({
    starting_after: page1.data.pagination.next,
  });

  // Continue pagination as needed
  if (page2.success && page2.data.pagination.has_more) {
    const page3 = await client.listMemories({
      starting_after: page2.data.pagination.next,
    });
  }
}
```

#### Backward Pagination (Previous Pages)

To navigate backwards (to previous pages), use the `ending_before` parameter with the ID of the first item in the current page:

```typescript
// Get an initial page
const currentPage = await client.listMemories({ limit: 10 });

if (currentPage.success && currentPage.data.data.length > 0) {
  // Get the previous page using the first item's ID
  const previousPage = await client.listMemories({
    ending_before: currentPage.data.data[0].id,
  });
}
```

#### Combining with Filters

You can combine pagination with other filters:

```typescript
// First page with filters
const filteredPage = await client.listMemories({
  userId: "user_123",
  agentId: "agent_456",
  limit: 20,
});

// Next page with the same filters
if (filteredPage.success && filteredPage.data.pagination.has_more) {
  const nextFilteredPage = await client.listMemories({
    userId: "user_123",
    agentId: "agent_456",
    limit: 20,
    starting_after: filteredPage.data.pagination.next,
  });
}
```
