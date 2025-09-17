import { EntityDB } from "@babycommando/entity-db";

type EntityDBInstance = {
  db: any;
  dim: number;
  modelId: string;
};

const instances = new Map<string, EntityDBInstance>();

export async function getEntityDB(opts: {
  vectorPath: string;
  model?: string;
  dimension: number;
}) {
  const key = `${opts.vectorPath}:${opts.dimension}:${opts.model ?? "manual"}`;
  if (instances.has(key)) return instances.get(key)!;

  const db = new EntityDB({
    vectorPath: opts.vectorPath,
    model: opts.model,
  });

  const inst = { db, dim: opts.dimension, modelId: opts.model ?? "manual" };
  instances.set(key, inst);
  return inst;
}

export async function upsertEmbedding(params: {
  vectorPath: string;
  dimension: number;
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
}) {
  const { db } = await getEntityDB({
    vectorPath: params.vectorPath,
    dimension: params.dimension,
  });

  try {
    await db.update(params.id, {
      vector: params.embedding,
      metadata: {
        text: params.text,
        ...params.metadata,
      },
    });
  } catch {
    await db.insertManualVectors({
      id: params.id,
      text: params.text,
      embedding: params.embedding,
      metadata: params.metadata,
    });
  }
}

export async function deleteEmbedding(params: {
  vectorPath: string;
  dimension: number;
  id: string;
}) {
  const { db } = await getEntityDB({
    vectorPath: params.vectorPath,
    dimension: params.dimension,
  });
  await db.delete(params.id);
}

export type EntityDBResult = {
  id: string;
  score: number;
  metadata?: any;
  text?: string;
};

export async function searchByEmbedding(params: {
  vectorPath: string;
  dimension: number;
  queryEmbedding: number[];
  topK?: number;
}): Promise<EntityDBResult[]> {
  const { db } = await getEntityDB({
    vectorPath: params.vectorPath,
    dimension: params.dimension,
  });
  
  const results = await db.queryManualVectors(params.queryEmbedding);
  return (params.topK ? results.slice(0, params.topK) : results) as EntityDBResult[];
}

export async function clearEntityDB(params: {
  vectorPath: string;
  dimension: number;
}) {
  const { db } = await getEntityDB({
    vectorPath: params.vectorPath,
    dimension: params.dimension,
  });
  await db.clear();
}