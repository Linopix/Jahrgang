const COOKIE = "jg-preview-hint";
const MAX_AGE = 60 * 60 * 24 * 365;

export function previewHintSeen() {
  if (typeof document === "undefined") return true;
  return document.cookie.split(";").some((part) => part.trim() === `${COOKIE}=1`);
}

export function markPreviewHintSeen() {
  if (typeof document === "undefined") return;
  document.cookie = `${COOKIE}=1; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
}
