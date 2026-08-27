import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ACCOUNT_LIVE } from "@/lib/account/flags";
import { useAccount } from "@/lib/account/client";
import type { AccountStats } from "@/lib/account/types";

export const Route = createFileRoute("/konto")({
  component: KontoPage,
});

function Off({ title }: { title: string }) {
  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-lg px-5 py-10 lg:px-8">
      <a href="/" className="back-link">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">{title}</h1>
      <p className="mt-3 text-sm text-muted">
        Konto kommt später wieder. Spielen geht ganz ohne.
      </p>
    </main>
  );
}

function KontoPage() {
  if (!ACCOUNT_LIVE) return <Off title="Konto" />;
  return <KontoLive />;
}

function KontoLive() {
  const user = useAccount((s) => s.user);
  const loading = useAccount((s) => s.loading);
  const error = useAccount((s) => s.error);
  const hydrate = useAccount((s) => s.hydrate);
  const submit = useAccount((s) => s.submit);
  const logout = useAccount((s) => s.logout);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<AccountStats | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!user) {
      setStats(null);
      return;
    }
    void fetch("/api/scores", { credentials: "include" })
      .then((res) => res.json())
      .then((body: { me?: AccountStats | null }) => setStats(body.me ?? null))
      .catch(() => setStats(null));
  }, [user]);

  async function run(op: "register" | "login") {
    setBusy(true);
    await submit(op, name, secret);
    setBusy(false);
  }

  const rank = (n: number | null) => (n ? `#${n}` : "—");

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-lg px-5 py-10 lg:px-8">
      <a href="/" className="back-link">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Konto</h1>
      <p className="mt-3 text-sm text-muted">
        Name und Geheimwort. Wort weg: neues Konto.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">…</p>
      ) : user ? (
        <>
          <section className="mt-8 rounded-xl bg-raised px-5 py-6 shadow-border">
            <p className="text-xs tracking-[0.2em] text-muted uppercase">Angemeldet</p>
            <p className="mt-2 font-display text-2xl text-fg">{user.name}</p>
            <Button variant="secondary" className="mt-6 w-full" onClick={() => void logout()}>
              Abmelden
            </Button>
          </section>
          {stats ? (
            <section className="mt-8">
              <h2 className="text-sm font-medium text-fg">Deine Zahlen</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Stat label="Abende" value={String(stats.games)} />
                <Stat label="Siege" value={String(stats.wins)} />
                <Stat label="Punkte" value={String(stats.points)} />
                <Stat label="Gehört" value={String(stats.heard)} />
                <Stat label="Treffer" value={`${stats.hit}%`} />
                <Stat
                  label="Platz"
                  value={`${rank(stats.rank.day)} / ${rank(stats.rank.week)} / ${rank(stats.rank.all)}`}
                />
              </div>
              <p className="mt-3 text-xs text-subtle">Platz: Heute / Woche / Gesamt</p>
              <a href="/rangliste" className="mt-4 inline-block text-sm text-muted transition-colors duration-150 ease-out hover:text-fg">
                Zur Rangliste
              </a>
            </section>
          ) : null}
        </>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void run("login");
          }}
        >
          <label className="block">
            <span className="text-sm font-medium text-fg">Name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={18}
              autoComplete="username"
              className="mt-2 h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none focus:ring-2 focus:ring-primary/70"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-fg">Geheimwort</span>
            <input
              type="password"
              value={secret}
              onChange={(event) => setSecret(event.target.value)}
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-md bg-raised px-4 text-sm text-fg shadow-border outline-none focus:ring-2 focus:ring-primary/70"
            />
          </label>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          <div className="grid grid-cols-2 gap-2">
            <Button type="submit" disabled={busy}>
              Anmelden
            </Button>
            <Button type="button" variant="secondary" disabled={busy} onClick={() => void run("register")}>
              Anlegen
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-raised px-3 py-3 shadow-border">
      <p className="text-[0.65rem] tracking-[0.16em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-lg tabular-nums text-fg">{value}</p>
    </div>
  );
}
