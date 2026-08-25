import { createFileRoute } from "@tanstack/react-router";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { liveAccessToken, originOf, refreshSession, sessionCookie } from "@/lib/spotify/oauth.server";

export const Route = createFileRoute("/api/spotify/token")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!SPOTIFY_LIVE) return Response.json({ access: null, off: true }, { status: 503 });
        const session = await refreshSession(request);
        const access = session?.access ?? (await liveAccessToken(request));
        if (!access) return Response.json({ access: null }, { status: 401 });
        const headers = new Headers({ "content-type": "application/json" });
        if (session) headers.set("set-cookie", sessionCookie(originOf(request), session));
        return new Response(JSON.stringify({ access }), { headers });
      },
    },
  },
});
