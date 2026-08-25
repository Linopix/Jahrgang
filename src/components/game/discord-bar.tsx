import { useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useDiscord } from "@/lib/discord/client";
import { cn } from "@/lib/utils";

export function DiscordBar({ compact }: { compact?: boolean }) {
  const user = useDiscord((s) => s.user);
  const oauth = useDiscord((s) => s.oauth);
  const loading = useDiscord((s) => s.loading);
  const connect = useDiscord((s) => s.connect);
  const logout = useDiscord((s) => s.logout);
  const hydrate = useDiscord((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (loading) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact ? "justify-end" : "justify-center lg:justify-start")}>
      <Link to="/rangliste" className="text-xs text-subtle hover:text-fg">
        Rangliste
      </Link>
      {user ? (
        <>
          <span className="text-subtle">·</span>
          {user.avatar ? (
            <img src={user.avatar} alt="" className="size-5 rounded-full" />
          ) : null}
          <span className="text-xs text-fg">{user.username}</span>
          <button type="button" onClick={() => void logout()} className="text-xs text-subtle hover:text-fg">
            Trennen
          </button>
        </>
      ) : oauth ? (
        <>
          <span className="text-subtle">·</span>
          <button type="button" onClick={connect} className="text-xs text-subtle hover:text-fg">
            Discord verbinden
          </button>
        </>
      ) : null}
    </div>
  );
}
