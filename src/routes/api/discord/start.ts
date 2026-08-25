import { createFileRoute } from "@tanstack/react-router";
import { authorizeUrl, discordOAuthReady, mintState, stateCookie } from "@/lib/discord/oauth.server";

export const Route = createFileRoute("/api/discord/start")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!discordOAuthReady()) {
          return new Response("Discord ist nicht eingerichtet.", { status: 501 });
        }
        const state = mintState();
        return new Response(null, {
          status: 302,
          headers: {
            Location: authorizeUrl(request, state),
            "Set-Cookie": stateCookie(request, state),
          },
        });
      },
    },
  },
});
