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
