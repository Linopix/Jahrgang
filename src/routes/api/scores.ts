import { createFileRoute } from "@tanstack/react-router";
import { readDiscordProfile } from "@/lib/discord/oauth.server";
import { listBoard, saveScore } from "@/lib/discord/scores.server";

export const Route = createFileRoute("/api/scores")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const board = await listBoard(25);
          return Response.json({ board });
        } catch {
          return Response.json({ board: [] });
        }
      },
      POST: async ({ request }) => {
        const profile = readDiscordProfile(request);
        if (!profile) return Response.json({ error: "discord" }, { status: 401 });
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
          await saveScore(profile, {
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
