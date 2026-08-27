export function bigscreenActive() {
  if (typeof document === "undefined") return false;
  return Boolean(document.fullscreenElement);
}

export function enterBigscreen() {
  if (typeof document === "undefined") return;
  if (document.fullscreenElement) return;
  const root = document.documentElement;
  if (!root.requestFullscreen) return;
  void root.requestFullscreen({ navigationUI: "hide" }).catch(() => {
    /* Browser blockt ohne Geste auf diesem Gerät. */
  });
}

export function leaveBigscreen() {
  if (typeof document === "undefined") return;
  if (!document.fullscreenElement) return;
  void document.exitFullscreen?.().catch(() => {
    /* ignore */
  });
}
