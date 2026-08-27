import { useEffect } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { GameApp } from "@/components/game/app";
import { inviteCode } from "@/lib/og/meta";
import { wantsHostClaim } from "@/lib/game/room-code";
import { useOnline } from "@/lib/game/online-store";

export const Route = createFileRoute("/i/$code")({
  validateSearch: (search: Record<string, unknown>) => ({
    host: search.host === "1" || search.host === true || search.host === 1 ? "1" : undefined,
  }),
  loader: ({ params }) => {
    const code = inviteCode(params.code);
    if (!code) throw redirect({ href: "/" });
    return { code };
  },
  component: InviteJoin,
});

function InviteJoin() {
  const { code } = Route.useParams();
  const { host } = Route.useSearch();

  useEffect(() => {
    const room = inviteCode(code);
    if (room.length !== 4) return;
    const current = useOnline.getState();
    if (current.status !== "off" && current.status !== "entry") return;
    current.openEntry(room, { claim: wantsHostClaim(host) });
  }, [code, host]);

  return <GameApp />;
}
