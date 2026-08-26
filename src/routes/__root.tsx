import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ThemePicker } from "@/components/game/theme-picker";
import { inviteCode, ogMeta } from "@/lib/og/invite";
import appCss from "../styles.css?url";

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("jahrgang-theme");var u=[];try{u=JSON.parse(localStorage.getItem("jahrgang-theme-unlocks")||"[]")}catch(e){}var ok=t==="night"||t==="paper"||t==="ink"||t==="ember"||t==="glass"||t==="retro"||(t==="disco"&&u.indexOf("disco")>=0);if(ok)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

function roomFromLocation(location: { href?: string; search?: unknown; searchStr?: string }) {
  if (typeof location.search === "object" && location.search && "room" in location.search) {
    const value = (location.search as { room?: unknown }).room;
    if (typeof value === "string") return inviteCode(value);
  }
  const href = location.href || "";
  try {
    const url = href.includes("://") ? new URL(href) : new URL(href, "https://jahrgang.vercel.app");
    return inviteCode(url.searchParams.get("room"));
  } catch {
    const raw = typeof location.search === "string" ? location.search : location.searchStr || "";
    return inviteCode(new URLSearchParams(raw.startsWith("?") ? raw.slice(1) : raw).get("room"));
  }
}

export const Route = createRootRoute({
  loader: ({ location }) => ({ room: roomFromLocation(location) }),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "theme-color", content: "#0c0b0a" },
      ...ogMeta(loaderData?.room || undefined),
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
    ],
  }),
  component: () => (
    <html lang="de" className="antialiased" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="groove-bg min-h-dvh bg-bg text-fg">
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <ThemePicker />
        <Scripts />
      </body>
    </html>
  ),
});
