import type { CupGroupSize } from "./types.ts";

/**
 * Teilt n Personen in 3er- und 4er-Gruppen.
 * auto: möglichst viele Vierer. Rest 1 wird in drei Dreier aufgelöst,
 * Rest 2 in zwei Dreier, Rest 3 bleibt eine Dreiergruppe.
 */
export function planGroupSizes(n: number, prefer: CupGroupSize = "auto"): number[] {
  const count = Math.max(0, Math.floor(n));
  if (count <= 0) return [];
  if (count <= 2) return [count];
  if (prefer === 3) return planThrees(count);
  return planFours(count);
}

function planFours(n: number): number[] {
  let fours = Math.floor(n / 4);
  const rem = n % 4;
  if (rem === 0) return fill(fours, 4);
  if (rem === 3) return [...fill(fours, 4), 3];
  if (rem === 2) {
    if (fours >= 1) return [...fill(fours - 1, 4), 3, 3];
    return [2];
  }
  if (fours >= 2) return [...fill(fours - 2, 4), 3, 3, 3];
  if (fours === 1) return [3, 2];
  return [n];
}

function planThrees(n: number): number[] {
  let threes = Math.floor(n / 3);
  const rem = n % 3;
  if (rem === 0) return fill(threes, 3);
  if (rem === 1) {
    if (threes >= 1) return [...fill(threes - 1, 3), 4];
    return [1];
  }
  if (threes >= 2) return [...fill(threes - 2, 3), 4, 4];
  if (threes === 1) return [3, 2];
  return [2];
}

function fill(count: number, size: number): number[] {
  return Array.from({ length: Math.max(0, count) }, () => size);
}

export function groupLabel(index: number): string {
  return String.fromCharCode(65 + (index % 26));
}

export function splitBySizes<T>(items: T[], sizes: number[]): T[][] {
  const out: T[][] = [];
  let offset = 0;
  for (const size of sizes) {
    out.push(items.slice(offset, offset + size));
    offset += size;
  }
  return out;
}
