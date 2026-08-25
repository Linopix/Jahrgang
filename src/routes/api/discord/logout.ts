import { createFileRoute } from "@tanstack/react-router";
import { clearDiscordCookies } from "@/lib/discord/oauth.server";

export const Route = createFileRoute("/api/discord/logout")({
  server: {
    handlers: {
      POST: async () => {
        const cookies = clearDiscordCookies();
        const headers = new Headers();
        for (const row of cookies) headers.append("Set-Cookie", row);
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
      },
    },
  },
});
