import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game/app";
import { normalizeRoomCode, wantsHostClaim } from "@/lib/game/room-code";
import { useOnline } from "@/lib/game/online-store";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    room: typeof search.room === "string" ? search.room : undefined,
    host: search.host === "1" || search.host === true || search.host === 1 ? "1" : undefined,
  }),
  component: Home,
});

function Home() {
  const { room, host } = Route.useSearch();

  useEffect(() => {
    const code = normalizeRoomCode(room ?? "");
    if (code.length !== 4) return;
    const current = useOnline.getState();
    if (current.status !== "off") return;
    current.openEntry(code, { claim: wantsHostClaim(host) });
  }, [room, host]);

  return <GameApp />;
}
