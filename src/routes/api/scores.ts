import { createFileRoute } from "@tanstack/react-router";
import { listBoard, saveBoard } from "@/lib/account/server";
import { readAccount } from "@/lib/account/server";

export const Route = createFileRoute("/api/scores")({
  server: {
    handlers: {
      GET: async () => {
        try {
          return Response.json({ board: await listBoard(25) });
        } catch {
          return Response.json({ board: [] });
        }
      },
      POST: async ({ request }) => {
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
