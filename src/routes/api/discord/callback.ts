import { createFileRoute } from "@tanstack/react-router";
import {
  exchangeCode,
  originOf,
  profileCookie,
  readOAuthState,
} from "@/lib/discord/oauth.server";

export const Route = createFileRoute("/api/discord/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const home = originOf(request);
        const err = url.searchParams.get("error");
        if (err) return Response.redirect(`${home}/?discord=denied`, 302);
        const code = url.searchParams.get("code") ?? "";
        const state = url.searchParams.get("state") ?? "";
        const expect = readOAuthState(request);
        if (!code || !state || !expect || state !== expect) {
          return Response.redirect(`${home}/?discord=fail`, 302);
        }
        try {
          const profile = await exchangeCode(request, code);
          return new Response(null, {
            status: 302,
            headers: {
              Location: `${home}/?discord=ok`,
              "Set-Cookie": profileCookie(request, profile),
            },
          });
        } catch {
          return Response.redirect(`${home}/?discord=fail`, 302);
        }
      },
    },
  },
});
