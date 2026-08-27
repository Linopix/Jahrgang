import { createFileRoute } from "@tanstack/react-router";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { beginLogin, originOf } from "@/lib/spotify/oauth.server";

export const Route = createFileRoute("/api/spotify/login")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const home = `${originOf(request)}/`;
        if (!SPOTIFY_LIVE) return Response.redirect(`${home}?spotify=off`, 302);
        const started = beginLogin(request);
        if (!started) return Response.redirect(`${home}?spotify=setup`, 302);
        return new Response(null, {
          status: 302,
          headers: { Location: started.url, "set-cookie": started.pkce },
        });
      },
    },
  },
});
