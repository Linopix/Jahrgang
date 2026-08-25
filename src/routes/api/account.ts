import { createFileRoute } from "@tanstack/react-router";
import {
  clearSessionCookie,
  loginAccount,
  rateOk,
  readAccount,
  registerAccount,
  sessionCookie,
} from "@/lib/account/server";

export const Route = createFileRoute("/api/account")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.json({ user: readAccount(request) });
      },
      POST: async ({ request }) => {
        let body: { op?: string; name?: string; secret?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Ungültig." }, { status: 400 });
        }
        if (body.op === "logout") {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "content-type": "application/json", "set-cookie": clearSessionCookie() },
          });
        }
        if (!rateOk(request)) {
          return Response.json({ error: "Zu oft. Kurz warten." }, { status: 429 });
        }
        if (body.op !== "register" && body.op !== "login") {
          return Response.json({ error: "Ungültig." }, { status: 400 });
        }
        try {
          const account =
            body.op === "register"
              ? await registerAccount(body.name ?? "", body.secret ?? "")
              : await loginAccount(body.name ?? "", body.secret ?? "");
          return new Response(JSON.stringify({ user: account }), {
            status: 200,
            headers: {
              "content-type": "application/json",
              "set-cookie": sessionCookie(request, account),
            },
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Das hat nicht geklappt.";
          return Response.json({ error: message }, { status: 400 });
        }
      },
    },
  },
});
