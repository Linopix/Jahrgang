import { createFileRoute } from "@tanstack/react-router";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { beginLogin } from "@/lib/spotify/oauth.server";

export const Route = createFileRoute("/api/spotify/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!SPOTIFY_LIVE) return new Response("aus", { status: 503 });
        const started = beginLogin(request);
        if (!started) return new Response("Spotify ist nicht eingerichtet.", { status: 503 });
        return new Response(null, {
          status: 302,
          headers: { Location: started.url, "set-cookie": started.pkce },
        });
      },
    },
  },
});
