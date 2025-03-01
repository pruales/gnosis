#!/usr/bin/env bun
/**
 * Gnosis API Client Test Suite
 *
 * This script tests all endpoints of the Gnosis API.
 * It uses the provided API key for all tests.
 *
 * Usage:
 *   bun test/client-test.ts --api-key=<your-api-key> [--verbose] [--test-group=<group>]
 */

import { GnosisApiClient, Message, ApiResponse } from "../src";
import { parseArgs } from "util";

// Parse command line arguments
const args = parseArgs({
  options: {
    "api-key": { type: "string" },
    "test-group": { type: "string" },
    verbose: { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
    bail: { type: "boolean", default: false }, // Stop on first failure
    timeout: { type: "string", default: "30000" }, // Test timeout in ms
  },
  allowPositionals: true,
});

// Show help if requested
if (args.values.help) {
  console.log(`
Gnosis API Client Test Suite

Usage:
  bun test/client-test.ts --api-key=<your-api-key> [options]

Options:
  --api-key=<key>      Your API key (REQUIRED)
  --test-group=<group> Run only a specific test group (health, keys, prompts, memories, all)
  --verbose            Show detailed test information
  --bail               Stop testing after first failure
  --timeout=<ms>       Test timeout in milliseconds (default: 30000)
  -h, --help           Show this help message
  `);
  process.exit(0);
}

// Configuration and constants
const API_KEY = args.values["api-key"];
const BASE_URL = process.env.API_BASE_URL || "http://localhost:8787";
const TEST_USER_ID = "test-user-id";
const TEST_GROUP = args.values["test-group"] || "all";
const VERBOSE = args.values.verbose || false;
const BAIL = args.values.bail || false;
const TIMEOUT = parseInt(args.values.timeout as string, 10) || 30000;

// Validate required configuration
if (!API_KEY) {
  console.error(`
❌ ERROR: API key is REQUIRED.
Please provide your API key via the --api-key parameter.

Example:
  bun test/client-test.ts --api-key=your_api_key_here
  
For more information, run:
  bun test/client-test.ts --help
`);
  process.exit(1);
}

// Test state storage
interface TestState {
  apiClient: GnosisApiClient;
  memoryId?: string;
  newApiKeyId?: string;
  results: {
    passed: number;
    failed: number;
    skipped: number;
    total: number;
    duration: number;
  };
  startTime: number;
}

const testState: TestState = {
  apiClient: new GnosisApiClient({
    baseUrl: BASE_URL,
    apiKey: API_KEY,
    debug: VERBOSE,
  }),
  results: {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: 0,
    duration: 0,
  },
  startTime: Date.now(),
};

// Console styling helpers
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  gray: "\x1b[90m",
};

// Create a promise that rejects after the specified timeout
function timeoutPromise(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(
      () => reject(new Error(`Timeout after ${ms}ms: ${message}`)),
      ms
    );
  });
}

// Helper function to format the test duration
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Helper function to extract success/failure information from an API response
function validateResponse<T>(
  response: ApiResponse<T>,
  validator?: (data: T) => { isValid: boolean; message?: string }
): { success: boolean; error?: string } {
  if (!response.success) {
    return { success: false, error: response.error };
  }

  // If we have a validator function, use it to further validate the response
  if (validator && response.data) {
    const validation = validator(response.data);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.message || "Validation failed",
      };
    }
  }

  return { success: true };
}

// Helper function to run a test with timeout
async function runTestWithTimeout<T>(
  testFn: () => Promise<T>,
  timeoutMs = TIMEOUT
): Promise<T> {
  return Promise.race([
    testFn(),
    timeoutPromise(timeoutMs, "Test took too long to complete"),
  ]);
}

// Helper function to log test results
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logTestResult(testName: string, result: any, group: string): any {
  testState.results.total++;
  const testDuration = Date.now() - testState.startTime;

  console.log("\n---------------------------------------");
  console.log(`${colors.bright}TEST: ${testName}${colors.reset} (${group})`);
  console.log("---------------------------------------");

  if (result.success) {
    console.log(
      `${colors.green}✅ PASSED ${colors.dim}(${formatDuration(testDuration)})${
        colors.reset
      }`
    );
    testState.results.passed++;
  } else {
    console.log(
      `${colors.red}❌ FAILED: ${result.error} ${colors.dim}(${formatDuration(
        testDuration
      )})${colors.reset}`
    );
    if (VERBOSE) {
      console.log(`${colors.red}Error details:${colors.reset}`, result.error);
    }
    testState.results.failed++;

    if (BAIL) {
      console.log(
        `${colors.yellow}Stopping tests due to --bail option${colors.reset}`
      );
      printSummary();
      process.exit(1);
    }
  }

  if (VERBOSE) {
    console.log(
      `${colors.gray}Response data:${colors.reset}`,
      JSON.stringify(result, null, 2)
    );
  }

  return result;
}

// Function to determine if a test should be run based on the selected group
function shouldRunTest(group: string): boolean {
  return TEST_GROUP === "all" || TEST_GROUP === group;
}

// Function to print test summary
function printSummary(): void {
  const totalDuration = Date.now() - testState.startTime;

  console.log("\n===========================================");
  console.log(`${colors.bright}${colors.blue}📊 Test Summary${colors.reset}`);
  console.log("===========================================");
  console.log(
    `${colors.green}✅ Passed:  ${testState.results.passed}${colors.reset}`
  );
  console.log(
    `${colors.red}❌ Failed:  ${testState.results.failed}${colors.reset}`
  );
  console.log(
    `${colors.yellow}⏭️ Skipped: ${testState.results.skipped}${colors.reset}`
  );
  console.log(
    `${colors.blue}🔢 Total:   ${testState.results.total}${colors.reset}`
  );
  console.log(
    `${colors.magenta}⏱️ Duration: ${formatDuration(totalDuration)}${
      colors.reset
    }`
  );
  console.log("===========================================");

  if (testState.results.failed > 0) {
    console.log(
      `\n${colors.red}${colors.bright}❌ Some tests failed!${colors.reset}`
    );
  } else {
    console.log(
      `\n${colors.green}${colors.bright}✅ All tests completed successfully!${colors.reset}`
    );
  }
}

// Run all tests sequentially
async function runTests() {
  try {
    console.log(
      `\n${colors.bright}${colors.blue}🚀 Starting Gnosis API Tests${colors.reset}`
    );
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test Group: ${TEST_GROUP}`);
    console.log(`Verbose Mode: ${VERBOSE ? "Enabled" : "Disabled"}`);
    console.log(`Bail on Failure: ${BAIL ? "Enabled" : "Disabled"}`);
    console.log(`Timeout: ${TIMEOUT}ms`);
    console.log("---------------------------------------\n");

    // Create test groups
    const testGroups: Record<
      string,
      { name: string; tests: Array<() => Promise<any>> }
    > = {
      health: {
        name: "Health",
        tests: [testPing],
      },
      keys: {
        name: "API Keys",
        tests: [testGetApiKeys, testCreateApiKey],
      },
      prompts: {
        name: "Prompts",
        tests: [
          testGetInstructionsPrompt,
          testSetInstructionsPrompt,
          testResetInstructionsPrompt,
        ],
      },
      memories: {
        name: "Memories",
        tests: [
          testAddMemory,
          testListMemories,
          testGetMemory,
          testSearchMemories,
          testUpdateMemory,
        ],
      },
    };

    // Run selected test groups
    for (const [groupKey, group] of Object.entries(testGroups)) {
      if (shouldRunTest(groupKey)) {
        console.log(
          `\n${colors.cyan}Running ${group.name} Tests${colors.reset}`
        );
        for (const test of group.tests) {
          testState.startTime = Date.now(); // Reset timer for each test
          await runTestWithTimeout(test);
        }
      } else {
        console.log(
          `\n${colors.yellow}Skipping ${group.name} Tests${colors.reset}`
        );
        testState.results.skipped += group.tests.length;
      }
    }

    // -------------------------------------------------
    // Cleanup
    // -------------------------------------------------
    console.log(`\n${colors.cyan}Running Cleanup${colors.reset}`);

    if (testState.memoryId && shouldRunTest("memories")) {
      await testDeleteMemory();
    }

    // Revoke the created key if we created one during testing
    if (testState.newApiKeyId && shouldRunTest("keys")) {
      await testRevokeApiKey();
    }

    // Print test summary
    printSummary();

    if (testState.results.failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(
      `\n${colors.red}${colors.bright}❌ Test suite failed:${colors.reset}`,
      error
    );
    process.exit(1);
  }
}

// -------------------------------------------------
// Health Endpoint Tests
// -------------------------------------------------
async function testPing() {
  const result = await testState.apiClient.ping();
  return logTestResult("ping", result, "health");
}

// -------------------------------------------------
// API Key Endpoint Tests
// -------------------------------------------------
async function testGetApiKeys() {
  const result = await testState.apiClient.listApiKeys();

  const validation = validateResponse(result, (data) => ({
    isValid: Array.isArray(data.keys),
    message:
      "Response data is not in expected format. Expected 'keys' to be an array.",
  }));

  return logTestResult("listApiKeys", { ...result, ...validation }, "keys");
}

async function testCreateApiKey() {
  const result = await testState.apiClient.createApiKey();

  const validation = validateResponse(result, (data) => {
    if (!data.apiKey) {
      return {
        isValid: false,
        message:
          "Response data is not in expected format. Expected 'apiKey' property.",
      };
    }

    // Store API key ID for later tests if it exists
    if ("id" in data) {
      testState.newApiKeyId = data.id as string;
    }

    return { isValid: true };
  });

  return logTestResult("createApiKey", { ...result, ...validation }, "keys");
}

async function testRevokeApiKey() {
  if (!testState.newApiKeyId) {
    console.log(
      `${colors.yellow}⚠️ Skipping revokeApiKey test: No API key ID available${colors.reset}`
    );
    testState.results.skipped++;
    return { success: false, error: "No API key ID available" };
  }

  const result = await testState.apiClient.revokeApiKey(testState.newApiKeyId);
  return logTestResult("revokeApiKey", result, "keys");
}

// -------------------------------------------------
// Instructions Prompt Endpoint Tests
// -------------------------------------------------
async function testGetInstructionsPrompt() {
  const result = await testState.apiClient.getInstructionsPrompt();

  const validation = validateResponse(result, (data) => ({
    isValid: Array.isArray(data.prompt),
    message:
      "Response data is not in expected format. Expected 'prompt' to be an array.",
  }));

  return logTestResult(
    "getInstructionsPrompt",
    { ...result, ...validation },
    "prompts"
  );
}

async function testSetInstructionsPrompt() {
  const promptContent: Message[] = [
    { role: "system", content: "You are a helpful instructions assistant." },
    {
      role: "user",
      content: "Please extract key facts from the provided text.",
    },
  ];

  const result = await testState.apiClient.setInstructionsPrompt(promptContent);
  return logTestResult("setInstructionsPrompt", result, "prompts");
}

async function testResetInstructionsPrompt() {
  const result = await testState.apiClient.resetInstructionsPrompt();
  return logTestResult("resetInstructionsPrompt", result, "prompts");
}

// -------------------------------------------------
// Memory Endpoint Tests
// -------------------------------------------------
async function testAddMemory() {
  const messages: Message[] = [
    {
      role: "user",
      content:
        "This is a test memory created by the API test script. My key fact is that I am a test user.",
    },
  ];

  const result = await testState.apiClient.addMemory(TEST_USER_ID, messages);

  const validation = validateResponse(result, (data) => {
    if (!Array.isArray(data)) {
      return {
        isValid: false,
        message:
          "Response data is not in expected format. Expected an array of memory updates.",
      };
    }

    if (data.length === 0) {
      return {
        isValid: false,
        message: "Response data contains an empty array.",
      };
    }

    // Store memory ID for later tests
    const memoryId = data[0].id;
    if (!memoryId) {
      return {
        isValid: false,
        message: "Memory ID not found in the response.",
      };
    }

    testState.memoryId = memoryId;
    return { isValid: true };
  });

  return logTestResult("addMemory", { ...result, ...validation }, "memories");
}

async function testListMemories() {
  const result = await testState.apiClient.listMemories({
    userId: TEST_USER_ID,
    limit: 10,
  });

  const validation = validateResponse(result, (data) => ({
    isValid: Array.isArray(data.data),
    message:
      "Response data is not in expected format. Expected 'data' to be an array.",
  }));

  return logTestResult(
    "listMemories",
    { ...result, ...validation },
    "memories"
  );
}

async function testGetMemory() {
  if (!testState.memoryId) {
    console.log(
      `${colors.yellow}⚠️ Skipping getMemory test: No memory ID available${colors.reset}`
    );
    testState.results.skipped++;
    return { success: false, error: "No memory ID available" };
  }

  const result = await testState.apiClient.getMemory(testState.memoryId);

  const validation = validateResponse(result, (data) => {
    if (!data.id || !data.text) {
      return {
        isValid: false,
        message:
          "Response data is not in expected format. Expected 'id' and 'text' properties.",
      };
    }
    return { isValid: true };
  });

  return logTestResult("getMemory", { ...result, ...validation }, "memories");
}

async function testSearchMemories() {
  const query = "test";
  const result = await testState.apiClient.searchMemories(
    query,
    TEST_USER_ID,
    100
  );

  const validation = validateResponse(result, (data) => ({
    isValid: Array.isArray(data),
    message:
      "Response data is not in expected format. Expected an array of memories.",
  }));

  return logTestResult(
    "searchMemories",
    { ...result, ...validation },
    "memories"
  );
}

async function testUpdateMemory() {
  if (!testState.memoryId) {
    console.log(
      `${colors.yellow}⚠️ Skipping updateMemory test: No memory ID available${colors.reset}`
    );
    testState.results.skipped++;
    return { success: false, error: "No memory ID available" };
  }

  const updatedText = "This memory was updated by the Gnosis API test script";
  const result = await testState.apiClient.updateMemory(
    testState.memoryId,
    updatedText
  );
  return logTestResult("updateMemory", result, "memories");
}

async function testDeleteMemory() {
  if (!testState.memoryId) {
    console.log(
      `${colors.yellow}⚠️ Skipping deleteMemory test: No memory ID available${colors.reset}`
    );
    testState.results.skipped++;
    return { success: false, error: "No memory ID available" };
  }

  const result = await testState.apiClient.deleteMemory(testState.memoryId);
  return logTestResult("deleteMemory", result, "memories");
}

// Run all the tests with error handling
runTests().catch((error) => {
  console.error(
    `${colors.red}${colors.bright}❌ Unhandled exception:${colors.reset}`,
    error
  );
  process.exit(1);
});
