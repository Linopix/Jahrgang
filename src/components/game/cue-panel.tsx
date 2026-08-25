import { trackSearchLinks } from "@/lib/game/cue";

type CuePanelProps = {
  title: string;
  artist: string;
  open: boolean;
  online: boolean;
};

export function CuePanel({ title, artist, open, online }: CuePanelProps) {
  if (!open) {
    return (
      <div className="mt-4 w-full max-w-md rounded-xl bg-raised px-4 py-3 text-sm text-muted shadow-border">
        {online
          ? "Der Host legt den Titel in seinem Musik-Abo auf. Über denselben Raum oder Discord zuhören."
          : "Warten, bis der Titel läuft."}
      </div>
    );
  }

  const links = trackSearchLinks(title, artist);

  return (
    <div className="mt-4 w-full max-w-md rounded-xl bg-raised p-4 text-left shadow-border">
      <p className="text-xs font-medium tracking-[0.16em] text-muted uppercase">Auflegen</p>
      <p className="mt-2 font-medium text-fg">{title}</p>
      <p className="text-sm text-muted">{artist}</p>
      <p className="mt-2 text-xs text-subtle">
        In deinem Abo öffnen. Jahrgang speichert und spielt keine Musikdateien.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {links.map((link) => (
          <a
            key={link.id}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center justify-center rounded-md bg-surface text-sm font-medium text-fg shadow-border transition-colors hover:bg-primary hover:text-primary-fg"
          >
            {link.label}
          </a>
        ))}
      </div>
    </div>
  );
}
