// src/lib/atlas/atlasAdapter.ts
import { Note } from "@/types/notes";

// Minimal shape expected from your embeddings index
export interface AtlasRecord {
  id: string;
  title: string;
  snippet: string;
  vector: number[];     // high-D embedding
}

export interface AtlasData {
  x: Float32Array;
  y: Float32Array;
  categories: Uint8Array; // optional, kept as zeros
  ids: string[];
  titles: string[];
  snippets: string[];
}

// Utility to min-max scale an array to [-1, 1]
function scaleToUnitRange(vals: number[]): number[] {
  if (vals.length === 0) return vals;
  let min = Infinity, max = -Infinity;
  for (const v of vals) { if (v < min) min = v; if (v > max) max = v; }
  if (min === max) return vals.map(() => 0);
  return vals.map(v => ((v - min) / (max - min)) * 2 - 1);
}

// Project embeddings to 2D (x = dim0, y = dim1) with scaling.
// Replace this later with PCA/UMAP if desired.
export function toAtlasData(records: AtlasRecord[]): AtlasData {
  const n = records.length;
  const xRaw: number[] = new Array(n);
  const yRaw: number[] = new Array(n);
  const ids: string[] = new Array(n);
  const titles: string[] = new Array(n);
  const snippets: string[] = new Array(n);
  const categories = new Uint8Array(n); // single category for now

  for (let i = 0; i < n; i++) {
    const r = records[i];
    const v = r.vector;
    xRaw[i] = v?.[0] ?? 0;
    yRaw[i] = v?.[1] ?? 0;
    ids[i] = r.id;
    titles[i] = r.title;
    snippets[i] = r.snippet;
    categories[i] = 0;
  }

  const xScaled = scaleToUnitRange(xRaw);
  const yScaled = scaleToUnitRange(yRaw);

  return {
    x: new Float32Array(xScaled),
    y: new Float32Array(yScaled),
    categories,
    ids,
    titles,
    snippets,
  };
}