import { createFileRoute } from "@tanstack/react-router";
import { ACCOUNT_LIVE } from "@/lib/account/flags";
import { accountStats, listBoards, readAccount, saveBoard } from "@/lib/account/server";

export const Route = createFileRoute("/api/scores")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if (!ACCOUNT_LIVE) return Response.json({ day: [], week: [], all: [], me: null, off: true });
        try {
          const boards = await listBoards(20);
          const me = readAccount(request);
          const stats = me ? await accountStats(me.id) : null;
          return Response.json({ ...boards, me: stats });
        } catch {
          return Response.json({ day: [], week: [], all: [], me: null });
        }
      },
      POST: async ({ request }) => {
        if (!ACCOUNT_LIVE) return Response.json({ error: "aus" }, { status: 503 });
        const account = readAccount(request);
        if (!account) return Response.json({ error: "konto" }, { status: 401 });
        let body: {
          wins?: number;
          points?: number;
          heard?: number;
          placedOk?: number;
          variant?: string;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "body" }, { status: 400 });
        }
        try {
          await saveBoard(account, {
            wins: Number(body.wins) || 0,
            points: Number(body.points) || 0,
            heard: Number(body.heard) || 0,
            placedOk: Number(body.placedOk) || 0,
            variant: typeof body.variant === "string" ? body.variant : "timeline",
          });
          return Response.json({ ok: true });
        } catch {
          return Response.json({ error: "save" }, { status: 500 });
        }
      },
    },
  },
});
