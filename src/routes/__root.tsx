import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { ThemePicker } from "@/components/game/theme-picker";
import appCss from "../styles.css?url";

const APP_NAME = "Jahrgang";

const THEME_BOOT = `(function(){try{var t=localStorage.getItem("jahrgang-theme");var u=[];try{u=JSON.parse(localStorage.getItem("jahrgang-theme-unlocks")||"[]")}catch(e){}var ok=t==="night"||t==="paper"||t==="ink"||t==="ember"||t==="glass"||t==="retro"||(t==="disco"&&u.indexOf("disco")>=0);if(ok)document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      {
        name: "description",
        content:
          "Jahrgang: Titel hören und nach Erscheinungsjahr auf der Zeitlinie einordnen.",
      },
      { property: "og:title", content: APP_NAME },
      {
        property: "og:description",
        content: "Musik-Zeitspiel. Raumcode teilen, mitspielen.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "/og.jpg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:type", content: "image/jpeg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: APP_NAME },
      {
        name: "twitter:description",
        content: "Musik-Zeitspiel. Raumcode teilen, mitspielen.",
      },
      { name: "twitter:image", content: "/og.jpg" },
      { name: "theme-color", content: "#0c0b0a" },
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
