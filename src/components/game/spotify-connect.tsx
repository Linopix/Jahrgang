import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { useSpotify } from "@/lib/spotify/session";
import { Button } from "@/components/ui/button";

export function SpotifyConnect() {
  const user = useSpotify((s) => s.user);
  const ready = useSpotify((s) => s.ready);
  const login = useSpotify((s) => s.login);
  const logout = useSpotify((s) => s.logout);

  if (!SPOTIFY_LIVE) return null;

  if (!ready) {
    return <p className="text-sm text-muted">Spotify…</p>;
  }

  if (!user) {
    return (
      <div className="rounded-lg bg-raised px-4 py-3 text-sm text-muted">
        <p>Mit Spotify anmelden. Dann läuft der Abend über dein Konto.</p>
        <Button className="mt-3 w-full" onClick={login}>
          Bei Spotify anmelden
        </Button>
      </div>
    );
  }

  return (
    <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
      <span>
        Spotify: {user.name}
        {user.product === "premium" ? "" : " · Free, nur Vorschau"}
      </span>
      <button type="button" className="text-xs text-subtle hover:text-fg" onClick={() => void logout()}>
        Abmelden
      </button>
    </p>
  );
}

export function useSpotifyBlocked() {
  const user = useSpotify((s) => s.user);
  return SPOTIFY_LIVE && !user;
}
