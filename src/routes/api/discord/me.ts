import { createFileRoute } from "@tanstack/react-router";
import { discordClientId, discordOAuthReady, readDiscordProfile } from "@/lib/discord/oauth.server";

export const Route = createFileRoute("/api/discord/me")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.json({
          oauth: discordOAuthReady(),
          clientId: discordClientId() || null,
          user: readDiscordProfile(request),
        });
      },
    },
  },
});
