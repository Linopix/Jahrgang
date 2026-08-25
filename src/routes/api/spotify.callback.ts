import { createFileRoute } from "@tanstack/react-router";
import { SPOTIFY_LIVE } from "@/lib/spotify/flags";
import { finishLogin, originOf } from "@/lib/spotify/oauth.server";

export const Route = createFileRoute("/api/spotify/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const origin = originOf(request);
        const home = `${origin}/`;
        if (!SPOTIFY_LIVE) return Response.redirect(home, 302);
        const url = new URL(request.url);
        const code = url.searchParams.get("code") ?? "";
        const state = url.searchParams.get("state") ?? "";
        const done = await finishLogin(request, code, state);
        if (!done) return Response.redirect(`${home}?spotify=fail`, 302);
        const headers = new Headers({ Location: `${home}?spotify=ok` });
        headers.append("set-cookie", done.cookies[0] ?? "");
        if (done.cookies[1]) headers.append("set-cookie", done.cookies[1]);
        return new Response(null, { status: 302, headers });
      },
    },
  },
});
