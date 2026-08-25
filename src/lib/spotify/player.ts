import { SPOTIFY_LIVE } from "./flags";

type SpotifyNamespace = {
  Player: new (opts: {
    name: string;
    getOAuthToken: (cb: (token: string) => void) => void;
    volume?: number;
  }) => SpotifyPlayer;
};

type SpotifyPlayer = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  pause: () => Promise<void>;
  addListener: (event: string, cb: (arg: { device_id?: string; message?: string }) => void) => void;
};

declare global {
  interface Window {
    Spotify?: SpotifyNamespace;
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

let deviceId: string | null = null;
let player: SpotifyPlayer | null = null;
let starting: Promise<boolean> | null = null;

async function accessToken(): Promise<string | null> {
  if (!SPOTIFY_LIVE) return null;
  const res = await fetch("/api/spotify/token");
  if (!res.ok) return null;
  const json = (await res.json()) as { access?: string };
  return json.access || null;
}

function loadSdk(): Promise<SpotifyNamespace> {
  if (window.Spotify) return Promise.resolve(window.Spotify);
  return new Promise((resolve, reject) => {
    const prev = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      prev?.();
      if (window.Spotify) resolve(window.Spotify);
      else reject(new Error("sdk"));
    };
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("sdk"));
    document.head.appendChild(script);
  });
}

export async function ensureSpotifyPlayer(): Promise<boolean> {
  if (!SPOTIFY_LIVE) return false;
  if (deviceId && player) return true;
  if (starting) return starting;
  starting = (async () => {
    const token = await accessToken();
    if (!token) return false;
    const sdk = await loadSdk();
    const next = new sdk.Player({
      name: "Jahrgang",
      getOAuthToken: (cb) => {
        void accessToken().then((t) => cb(t || ""));
      },
      volume: 0.85,
    });
    await new Promise<void>((resolve) => {
      next.addListener("ready", (event) => {
        deviceId = event.device_id ?? null;
        resolve();
      });
      next.addListener("not_ready", () => {
        deviceId = null;
      });
      void next.connect();
      window.setTimeout(() => resolve(), 4000);
    });
    player = next;
    return Boolean(deviceId);
  })();
  const ok = await starting;
  if (!ok) starting = null;
  return ok;
}

export async function playSpotifyUri(uri: string): Promise<boolean> {
  if (!SPOTIFY_LIVE || !uri.startsWith("spotify:")) return false;
  const ready = await ensureSpotifyPlayer();
  const token = await accessToken();
  if (!token) return false;
  const body: { uris: string[]; device_id?: string } = { uris: [uri] };
  if (ready && deviceId) body.device_id = deviceId;
  const res = await fetch(
    ready && deviceId
      ? `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`
      : "https://api.spotify.com/v1/me/player/play",
    {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ uris: [uri], position_ms: 0 }),
    },
  );
  return res.ok || res.status === 204;
}

export async function pauseSpotify(): Promise<void> {
  if (!SPOTIFY_LIVE) return;
  try {
    await player?.pause();
  } catch {
    /* ignore */
  }
  const token = await accessToken();
  if (!token) return;
  try {
    await fetch("https://api.spotify.com/v1/me/player/pause", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    /* ignore */
  }
}
