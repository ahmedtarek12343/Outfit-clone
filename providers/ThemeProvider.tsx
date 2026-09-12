"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

/**
 * Keeps <html data-theme> in sync with the store.
 *
 * The store's `setTheme` already writes the attribute imperatively for
 * instant feedback, so this effect is the *safety net*: it covers state
 * changes that did not come from a click (hydration, devtools, a future
 * "system preference" listener).
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
}
