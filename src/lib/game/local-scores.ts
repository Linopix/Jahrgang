const KEY = "jahrgang-scores";

export type LocalScore = {
  name: string;
  wins: number;
  points: number;
  heard: number;
  variant: string;
  at: number;
};

function read(): LocalScore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as LocalScore[];
    return Array.isArray(raw) ? raw.slice(0, 40) : [];
  } catch {
    return [];
  }
}

export function localBoard(): LocalScore[] {
  return read().sort((a, b) => b.wins - a.wins || b.points - a.points);
}

export function recordLocalScore(row: Omit<LocalScore, "at">) {
  if (typeof window === "undefined") return;
  const next = [{ ...row, at: Date.now() }, ...read()].slice(0, 40);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // quota
  }
}
