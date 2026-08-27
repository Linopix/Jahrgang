import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { useSpotify } from "@/lib/spotify/session";
import { Button } from "@/components/ui/button";

function hintFromUrl() {
  if (typeof window === "undefined") return "";
  const flag = new URLSearchParams(window.location.search).get("spotify");
  if (flag === "fail") return "Anmeldung bei Spotify ist fehlgeschlagen. Nochmal versuchen.";
  if (flag === "setup") {
    return "Spotify-App ist noch ohne Client-ID am Server. Spielen geht trotzdem.";
  }
  if (flag === "ok") return "Spotify ist verbunden.";
  return "";
}

export function SpotifyConnect({ compact }: { compact?: boolean }) {
  const user = useSpotify((s) => s.user);
  const ready = useSpotify((s) => s.ready);
  const configured = useSpotify((s) => s.configured);
  const login = useSpotify((s) => s.login);
  const logout = useSpotify((s) => s.logout);
  const hint = hintFromUrl();

  if (!SPOTIFY_LIVE) return null;

  if (!ready) {
    return <p className="text-sm text-muted">Spotify…</p>;
  }

  if (!user) {
    if (!configured) {
      if (compact) return null;
      return (
        <p className="text-sm text-muted">
          Spotify bleibt extra. Ohne Client-ID am Server läuft der Abend mit der öffentlichen
          Vorschau.
        </p>
      );
    }
    return (
      <div className={compact ? "text-sm text-muted" : "rounded-lg bg-raised px-4 py-3 text-sm text-muted"}>
        <p>
          Optional: mit <span className="text-fg">deinem</span> Spotify-Konto. Jahrgang nutzt nie
          unser Konto. Likes, Playlists und Top-Titel rutschen in den Stapel, wenn sie zum Pack
          passen.
        </p>
        {hint ? <p className="mt-2 text-xs text-subtle">{hint}</p> : null}
        <Button className="mt-3 w-full" variant={compact ? "secondary" : "primary"} onClick={login}>
          Spotify optional verbinden
        </Button>
      </div>
    );
  }

  return (
    <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
      <span>
        Spotify: {user.name}
        {user.product === "premium" ? " · volle Titel" : " · Free, Vorschau"}
      </span>
      <button type="button" className="text-xs text-subtle transition-colors duration-150 ease-out hover:text-fg" onClick={() => void logout()}>
        Trennen
      </button>
    </p>
  );
}

export function useSpotifyBlocked() {
  return false;
}

export function useSpotifyConnected() {
  const user = useSpotify((s) => s.user);
  return SPOTIFY_LIVE && Boolean(user);
}
