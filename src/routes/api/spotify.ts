import { createFileRoute } from "@tanstack/react-router";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import {
  clearSessionCookie,
  liveAccessToken,
  originOf,
  publicUser,
  readSession,
  refreshSession,
  sessionCookie,
} from "@/lib/spotify/oauth.server";

export const Route = createFileRoute("/api/spotify")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!SPOTIFY_LIVE) return Response.json({ user: null, off: true });
        const session = await refreshSession(request);
        const headers = new Headers({ "content-type": "application/json" });
        if (session) headers.set("set-cookie", sessionCookie(originOf(request), session));
        return new Response(JSON.stringify({ user: publicUser(session) }), { headers });
      },
      POST: async ({ request }) => {
        if (!SPOTIFY_LIVE) return Response.json({ error: "aus" }, { status: 503 });
        let body: { op?: string } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          body = {};
        }
        if (body.op === "logout") {
          return new Response(JSON.stringify({ ok: true }), {
            headers: { "content-type": "application/json", "set-cookie": clearSessionCookie() },
          });
        }
        const access = await liveAccessToken(request);
        if (!access) return Response.json({ error: "anmelden" }, { status: 401 });
        return Response.json({ access });
      },
    },
  },
});
