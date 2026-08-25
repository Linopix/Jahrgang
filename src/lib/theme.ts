export const THEME_IDS = ["night", "paper", "ink", "ember"] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "night", label: "Nacht", swatch: "#0c0b0a" },
  { id: "paper", label: "Papier", swatch: "#f3eee4" },
  { id: "ink", label: "Tinte", swatch: "#0b0e14" },
  { id: "ember", label: "Glut", swatch: "#140c0a" },
];

const KEY = "jahrgang-theme";

export function isThemeId(value: string | null): value is ThemeId {
  return THEME_IDS.includes(value as ThemeId);
}

export function readTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(KEY);
    if (isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return "night";
}

export function applyTheme(id: ThemeId) {
  document.documentElement.setAttribute("data-theme", id);
  const meta = document.querySelector('meta[name="theme-color"]');
  const swatch = THEMES.find((row) => row.id === id)?.swatch;
  if (meta && swatch) meta.setAttribute("content", swatch);
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}
