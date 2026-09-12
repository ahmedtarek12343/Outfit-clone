import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { DEFAULT_THEME, SITE, THEME_STORAGE_KEY } from "@/data/data";
import SmoothScroll from "@/components/layout/SmoothScroll";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Cursor from "@/components/layout/Cursor";
import TransitionProvider from "@/providers/TransitionProvider";
import ThemeProvider from "@/providers/ThemeProvider";

/* next/font self-hosts these at build time: no request to Google at runtime,
   and the font files are served from our own origin with a stable hash, which
   means zero layout shift and no third-party connection. */
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.intro,
  metadataBase: new URL(SITE.url),
  openGraph: {
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.intro,
    type: "website",
  },
};

/* Splitting viewport out of metadata is required in modern Next — returning
   `viewport` from the metadata export is deprecated. `themeColor` is left
   unset deliberately: it cannot follow a runtime theme switch, and a wrong
   browser-chrome colour is worse than none. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

/**
 * The no-flash theme script.
 *
 * This runs SYNCHRONOUSLY while the browser parses <head>, before any pixel is
 * painted. It is deliberately tiny, framework-free, and wrapped in try/catch
 * (localStorage throws in some privacy modes).
 *
 * Why not do this in a `useEffect`? Because effects run after the first paint.
 * The visitor would see the default cream theme for ~1 frame and then watch it
 * snap to dark. That single frame is the most common polish bug on themed
 * sites, and it is completely avoidable.
 */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (t === "cream" || t === "dark" || t === "blue") {
      document.documentElement.setAttribute("data-theme", t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      /* The server always renders the default; the script above may change it
         before hydration, so React must be told not to complain. */
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      {/*
        NOTE: this <body> is NOT hidden with opacity-0.
        A common pattern is to render the body invisible and have the scroll
        script fade it in — but that means if JS fails, errors, or is blocked,
        the visitor gets a permanently blank page. Everything here renders
        visible server-side and animation only ever *enhances* it.
      */}
      <body className="bg-bg text-fg font-sans antialiased">
        <ThemeProvider>
          <Cursor />
          <Navbar />
          <TransitionProvider>
            <SmoothScroll>
              <main id="main">{children}</main>
              <Footer />
            </SmoothScroll>
          </TransitionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
