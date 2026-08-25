import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAccount } from "@/lib/account/client";

export const Route = createFileRoute("/konto")({
  component: KontoPage,
});

function KontoPage() {
  const user = useAccount((s) => s.user);
  const loading = useAccount((s) => s.loading);
  const error = useAccount((s) => s.error);
  const hydrate = useAccount((s) => s.hydrate);
  const submit = useAccount((s) => s.submit);
  const logout = useAccount((s) => s.logout);
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  async function run(op: "register" | "login") {
    setBusy(true);
    await submit(op, name, secret);
    setBusy(false);
  }

  return (
    <main className="screen-in mx-auto min-h-dvh w-full max-w-md px-5 py-10 lg:px-8">
      <a href="/" className="text-sm text-muted transition-colors hover:text-fg">
        Zurück
      </a>
      <h1 className="mt-6 font-display text-4xl font-medium text-fg">Konto</h1>
      <p className="mt-3 text-sm text-muted">
        Nur Name und Geheimwort. Kein E-Mail, kein Discord. Damit die Rangliste über Geräte zählt.
        Merken — zurücksetzen gibt es nicht.
      </p>

      {loading ? (
        <p className="mt-8 text-sm text-muted">…</p>
      ) : user ? (
        <section className="mt-8 rounded-xl bg-raised px-5 py-6 shadow-border">
          <p className="text-xs tracking-[0.2em] text-muted uppercase">Angemeldet</p>
          <p className="mt-2 font-display text-2xl text-fg">{user.name}</p>
          <Button variant="secondary" className="mt-6 w-full" onClick={() => void logout()}>
            Abmelden
          </Button>
        </section>
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
