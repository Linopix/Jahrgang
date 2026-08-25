type Presence = {
  details: string;
  state: string;
  size?: number;
  max?: number;
  join?: string;
};

let last = "";

function inDiscordFrame() {
  if (typeof window === "undefined") return false;
  try {
    if (window.parent === window) return false;
    const ref = document.referrer;
    const search = window.location.search;
    return /discord/i.test(ref) || search.includes("frame_id") || search.includes("instance_id");
  } catch {
    return false;
  }
}

export function discordPresencePossible() {
  return inDiscordFrame();
}

export async function setDiscordPresence(next: Presence) {
  const key = JSON.stringify(next);
  if (key === last) return;
  last = key;
  if (!inDiscordFrame()) return;
  const clientId = (window as Window & { __DISCORD_CLIENT_ID__?: string }).__DISCORD_CLIENT_ID__;
  if (!clientId) return;
  try {
    const mod = await import("@discord/embedded-app-sdk");
    const sdk = new mod.DiscordSDK(clientId);
    await Promise.race([
      sdk.ready(),
      new Promise((_, reject) => window.setTimeout(() => reject(new Error("timeout")), 1500)),
    ]);
    await sdk.commands.setActivity({
      activity: {
        type: 0,
        details: next.details.slice(0, 128),
        state: next.state.slice(0, 128),
        timestamps: { start: Math.floor(Date.now() / 1000) },
        party: next.size
          ? {
              id: next.join ?? "jahrgang",
              size: [next.size, next.max ?? 8],
            }
          : undefined,
      },
    });
  } catch {
    // Browser oder Activity ohne Mapping: Presence bleibt aus.
  }
}
