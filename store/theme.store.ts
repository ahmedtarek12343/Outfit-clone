/**
 * Theme store.
 *
 * The tricky part of a theme switcher is not the switching, it is the FIRST
 * PAINT. The server has no idea what the visitor picked last time, so it must
 * render *some* default. If React then corrects it in an effect, the visitor
 * sees a flash of the wrong colour.
 *
 * The fix (per the Next.js "preventing flash before hydration" guide) is a
 * synchronous inline script in <head> that stamps `data-theme` on <html>
 * before the browser paints anything. This store then has to AGREE with that
 * script — which is what the lazy initialiser below does: it reads the exact
 * same localStorage key, so React's first client render already matches the
 * DOM the script produced.
 */
import { create } from "zustand";
import { DEFAULT_THEME, THEME_STORAGE_KEY, type ThemeName } from "@/data/data";

interface ThemeState {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  cycleTheme: () => void;
}

const THEME_ORDER: ThemeName[] = ["cream", "dark", "blue"];

/** Read the persisted theme. Returns the default on the server or if blocked. */
function readStoredTheme(): ThemeName {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && THEME_ORDER.includes(stored as ThemeName)) {
      return stored as ThemeName;
    }
  } catch {
    /* Safari private mode throws on localStorage access. Fall through. */
  }
  return DEFAULT_THEME;
}

function persist(theme: ThemeName) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* Non-fatal: the theme simply will not survive a reload. */
  }
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  // Lazy initialiser — runs once, on the client, before first render.
  theme: readStoredTheme(),

  setTheme: (theme) => {
    // Write the attribute imperatively as well as through the provider, so the
    // paint happens in the same frame as the click instead of after React's
    // commit. On a slow device that is the difference between "instant" and
    // "laggy".
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", theme);
      persist(theme);
    }
    set({ theme });
  },

  cycleTheme: () => {
    const next =
      THEME_ORDER[(THEME_ORDER.indexOf(get().theme) + 1) % THEME_ORDER.length];
    get().setTheme(next);
  },
}));
