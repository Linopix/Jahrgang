import { useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { GameApp } from "@/components/game/app";
import { normalizeRoomCode, wantsHostClaim } from "@/lib/game/room-code";
import { useOnline } from "@/lib/game/online-store";
import { readSeat } from "@/lib/game/seat";

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
    if (current.status !== "off" && current.status !== "entry") return;
    if (readSeat(code)) current.resumeSeat();
    else current.openEntry(code, { claim: wantsHostClaim(host) });
  }, [room, host]);

  return <GameApp />;
}
