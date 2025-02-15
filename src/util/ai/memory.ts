export type MemoryMetadata = {
  userId: string;
  memoryText: string;
};

export class Memory {
  private ai: Ai;
  private index: VectorizeIndex;

  constructor(ai: Ai, index: VectorizeIndex) {
    this.ai = ai;
    this.index = index;
  }

  async add(
    items: {
      id?: string;
      text: string;
      metadata: MemoryMetadata;
      namespace: string;
    }[]
  ) {
    // Generate embeddings for all texts in a single API call
    const embeddings = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
      text: items.map((item) => item.text),
    });

    if (!embeddings.data) throw new Error("embedding values are undefined");

    // Map the embeddings to vectors with IDs and metadata
    const vectors = items.map((item, index) => ({
      id: item.id ?? crypto.randomUUID(),
      values: embeddings.data[index],
      metadata: item.metadata,
      namespace: item.namespace,
    }));

    // Insert vectors into Vectorize
    await this.index.upsert(vectors);
  }

  async query(
    text: string,
    k: number = 10,
    namespace: string,
    filter?: VectorizeVectorMetadataFilter
  ) {
    if (!text) return;

    // Generate query embedding
    const embedding = await this.ai.run("@cf/baai/bge-base-en-v1.5", {
      text: text,
    });

    const values = embedding.data[0];

    if (!values) throw new Error("embedding values are undefined");

    // Query similar vectors
    return await this.index.query(values, {
      topK: k,
      filter: filter,
      returnValues: true,
      returnMetadata: "indexed",
      namespace: namespace,
    });
  }

  async getAllById(ids: string[]) {
    return await this.index.getByIds(ids);
  }

  async delete(ids: string[]) {
    await this.index.deleteByIds(ids);
  }
}

export default Memory;
