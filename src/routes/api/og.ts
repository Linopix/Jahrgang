import { createFileRoute } from "@tanstack/react-router";
import { inviteCode, invitePng, inviteSvg, SITE } from "@/lib/og/invite";

export const Route = createFileRoute("/api/og")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const code = inviteCode(url.searchParams.get("room"));
        if (!code) {
          const origin = url.origin.includes("localhost") ? SITE : url.origin;
          return Response.redirect(`${origin}/og.jpg`, 302);
        }
        if (url.searchParams.get("fmt") === "svg") {
          return new Response(inviteSvg(code), {
            headers: {
              "content-type": "image/svg+xml; charset=utf-8",
              "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
            },
          });
        }
        return new Response(new Uint8Array(invitePng(code)), {
          headers: {
            "content-type": "image/png",
            "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
          },
        });
      },
    },
  },
});
