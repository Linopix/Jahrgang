export const THEME_IDS = ["night", "paper", "ink", "ember", "glass", "retro", "disco"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: { id: ThemeId; label: string; swatch: string; chrome?: string; secret?: boolean }[] = [
  { id: "night", label: "Nacht", swatch: "#0c0b0a" },
  { id: "paper", label: "Papier", swatch: "#f3eee4" },
  { id: "ink", label: "Tinte", swatch: "#0b0e14" },
  { id: "ember", label: "Glut", swatch: "#140c0a" },
  { id: "glass", label: "Glas", swatch: "#7eb4e8", chrome: "#0a1220" },
  { id: "retro", label: "Retro", swatch: "#c9a15b", chrome: "#1a1610" },
  { id: "disco", label: "Cheat", swatch: "#ff4de8", chrome: "#120016", secret: true },
];

const KEY = "jahrgang-theme";
const UNLOCK_KEY = "jahrgang-theme-unlocks";

export function isThemeId(value: string | null): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function readUnlocks(): ThemeId[] {
  try {
    const raw = localStorage.getItem(UNLOCK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ThemeId => typeof item === "string" && isThemeId(item));
  } catch {
    return [];
  }
}

export function isThemeUnlocked(id: ThemeId) {
  const row = THEMES.find((item) => item.id === id);
  if (!row?.secret) return true;
  return readUnlocks().includes(id);
}

export function unlockTheme(id: ThemeId) {
  const next = new Set(readUnlocks());
  next.add(id);
  try {
    localStorage.setItem(UNLOCK_KEY, JSON.stringify([...next]));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("jahrgang-theme"));
}

export function visibleThemes() {
  return THEMES.filter((row) => !row.secret || isThemeUnlocked(row.id));
}

export function readTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(KEY);
    if (isThemeId(stored) && isThemeUnlocked(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "night";
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  const meta = document.querySelector('meta[name="theme-color"]');
  const row = THEMES.find((item) => item.id === id);
  const swatch = row?.chrome ?? row?.swatch;
  if (meta && swatch) meta.setAttribute("content", swatch);
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("jahrgang-theme"));
}
