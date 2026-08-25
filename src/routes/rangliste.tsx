import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DiscordBar } from "@/components/game/discord-bar";
import { localBoard } from "@/lib/game/local-scores";
import { useDiscord } from "@/lib/discord/client";

type BoardRow = {
  discordId: string;
  name: string;
  avatar: string | null;
  wins: number;
  points: number;
  heard: number;
};

export const Route = createFileRoute("/rangliste")({
  component: BoardPage,
});

function BoardPage() {
  const user = useDiscord((s) => s.user);
  const oauth = useDiscord((s) => s.oauth);
  const hydrate = useDiscord((s) => s.hydrate);
  const connect = useDiscord((s) => s.connect);
  const [board, setBoard] = useState<BoardRow[]>([]);
  const local = localBoard().slice(0, 12);

  useEffect(() => {
    void hydrate();
    void fetch("/api/scores")
      .then((res) => res.json())
      .then((body: { board?: BoardRow[] }) => setBoard(body.board ?? []))
      .catch(() => setBoard([]));
  }, [hydrate]);

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-2xl px-5 py-10 lg:px-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Rangliste</h1>
      <p className="mt-3 text-sm text-muted">
        Discord-Konto zählt Abende über Geräte. Ohne Verbindung bleibt der Stand auf diesem Gerät.
      </p>
      <div className="mt-4">
        <DiscordBar />
      </div>
      {!user && oauth ? (
        <button type="button" onClick={connect} className="mt-4 text-sm text-fg underline-offset-4 hover:underline">
          Mit Discord verbinden
        </button>
      ) : null}

      <section className="mt-10">
        <h2 className="text-sm font-medium text-fg">Discord</h2>
        {board.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch keine verbundenen Abende.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {board.map((row, i) => (
              <Row key={row.discordId} place={i + 1} name={row.name} avatar={row.avatar} wins={row.wins} points={row.points} me={user?.id === row.discordId} />
            ))}
          </ol>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-medium text-fg">Dieses Gerät</h2>
        {local.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Noch keine Runde hier.</p>
        ) : (
          <ol className="mt-3 space-y-2">
            {local.map((row, i) => (
              <Row key={`${row.at}-${i}`} place={i + 1} name={row.name} avatar={null} wins={row.wins} points={row.points} />
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

function Row({
  place,
  name,
  avatar,
  wins,
  points,
  me,
}: {
  place: number;
  name: string;
  avatar: string | null;
  wins: number;
  points: number;
  me?: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-md px-4 py-3 text-sm shadow-border ${me ? "bg-primary text-primary-fg" : "bg-raised text-fg"}`}
    >
      <span className="w-6 tabular-nums text-xs opacity-70">{place}</span>
      {avatar ? <img src={avatar} alt="" className="size-7 rounded-full" /> : <span className="size-7 rounded-full bg-surface" />}
      <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
      <span className="tabular-nums text-xs opacity-70">
        {wins} Siege · {points} Pkt
      </span>
    </li>
  );
}
