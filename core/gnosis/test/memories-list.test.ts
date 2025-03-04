import { describe, it, expect, beforeAll } from "vitest";
import { GnosisApiClient, Memory } from "@gnosis.dev/sdk";

describe("Memories List", () => {
  const apiKey = process.env.VITE_API_KEY;
  if (!apiKey) {
    throw new Error("VITE_API_KEY is not set");
  }
  const client = new GnosisApiClient({
    baseUrl: "http://localhost:8787",
    apiKey,
  });

  let allMemories: Memory[] = [];

  beforeAll(async () => {
    const response = await client.listMemories({
      limit: 100,
    });
    if (!response.success) {
      throw new Error("Failed to get all memories");
    }
    allMemories = response.data?.data ?? [];

    console.log(
      "[Running tests for listing memories] Found",
      allMemories.length,
      "memories"
    );

    //assume we have 22 memories in the database for testing
    if (allMemories.length !== 22) {
      throw new Error("Expected 22 memories, got " + allMemories.length);
    }
  });

  it("should get memories", async () => {
    const memories = await client.listMemories({
      limit: 100,
    });

    expect(memories.success).toBe(true);
    expect(memories.data?.has_more).toBe(false);
    expect(memories.data?.data).toEqual(allMemories);
  });

  it("should paginate memories forward until the end", async () => {
    const limit = 10;
    const page1 = await client.listMemories({
      limit,
    });
    const page1Data = page1.data?.data;
    if (!page1Data) {
      throw new Error("Page 1 data is undefined");
    }

    expect(page1.success).toBe(true);
    expect(page1.data?.has_more).toBe(true);
    expect(page1Data.length).toEqual(limit);
    expect(page1Data).toEqual(allMemories.slice(0, limit));

    const page2 = await client.listMemories({
      limit,
      starting_after: page1Data[page1Data.length - 1].id,
    });
    const page2Data = page2.data?.data;
    if (!page2Data) {
      throw new Error("Page 2 data is undefined");
    }

    expect(page2.success).toBe(true);
    expect(page2Data.length).toEqual(limit);
    expect(page2Data).toEqual(allMemories.slice(limit, 2 * limit));
    expect(page2.data?.has_more).toBe(true);

    const page3 = await client.listMemories({
      limit,
      starting_after: page2Data[page2Data.length - 1].id,
    });
    const page3Data = page3.data?.data;
    if (!page3Data) {
      throw new Error("Page 3 data is undefined");
    }

    expect(page3.success).toBe(true);
    expect(page3Data.length).toEqual(2);
    expect(page3Data).toEqual(allMemories.slice(2 * limit, allMemories.length));
    expect(page3.data?.has_more).toBe(false);
  });

  it("should paginate memories backward until the start", async () => {
    const limit = 10;
    //navigate forwards all pages
    const page1 = await client.listMemories({
      limit,
    });
    const page1Data = page1.data?.data;
    if (!page1Data) {
      throw new Error("Page 1 data is undefined");
    }
    const page2 = await client.listMemories({
      limit,
      starting_after: page1Data[page1Data.length - 1].id,
    });
    const page2Data = page2.data?.data;
    if (!page2Data) {
      throw new Error("Page 2 data is undefined");
    }
    const page3 = await client.listMemories({
      limit,
      starting_after: page2Data[page2Data.length - 1].id,
    });
    const page3Data = page3.data?.data;
    if (!page3Data) {
      throw new Error("Page 3 data is undefined");
    }

    //navigate backwards all pages
    const page2FromBack = await client.listMemories({
      limit,
      ending_before: page3Data[0].id,
    });
    const page2FromBackData = page2FromBack.data?.data;
    if (!page2FromBackData) {
      throw new Error("Page 2 from back data is undefined");
    }
    expect(page2FromBack.success).toBe(true);
    expect(page2FromBackData.length).toEqual(limit);
    expect(page2FromBackData).toEqual(allMemories.slice(limit, 2 * limit));
    expect(page2FromBack.data?.has_more).toBe(true);
    expect(page2FromBack.data?.has_more).toBe(true);

    const page1FromBack = await client.listMemories({
      limit,
      ending_before: page2FromBackData[0].id,
    });
    const page1FromBackData = page1FromBack.data?.data;
    if (!page1FromBackData) {
      throw new Error("Page 1 from back data is undefined");
    }
    expect(page1FromBack.success).toBe(true);
    expect(page1FromBackData.length).toEqual(limit);
    expect(page1FromBackData).toEqual(allMemories.slice(0, limit));
    expect(page1FromBack.data?.has_more).toBe(true);

    const page0FromBack = await client.listMemories({
      limit,
      ending_before: page1FromBackData[0].id,
    });
    const page0FromBackData = page0FromBack.data?.data;

    expect(page0FromBackData?.length).toEqual(0);
    expect(page0FromBack.data?.has_more).toBe(true);
    expect(page0FromBack.data?.data).toEqual([]);
    expect(page0FromBack.success).toBe(true);
  });

  it("should return has_more true when using last item as ending_before", async () => {
    const limit = 10;
    const page1 = await client.listMemories({
      limit,
      ending_before: allMemories[allMemories.length - 1].id,
    });
    expect(page1.success).toBe(true);
    expect(page1.data?.data?.length).toEqual(limit);
    expect(page1.data?.has_more).toBe(true);

    const page2 = await client.listMemories({
      limit,
      starting_after: page1.data?.data?.[page1.data?.data?.length - 1].id,
    });
    expect(page2.success).toBe(true);
    expect(page2.data?.data?.length).toEqual(1);
    expect(page2.data?.has_more).toBe(false);
  });
});
