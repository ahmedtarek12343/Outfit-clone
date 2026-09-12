"use client";

import { THEMES } from "@/data/data";
import { useThemeStore } from "@/store/theme.store";
import { cn } from "@/lib/utils";

/**
 * Theme switcher.
 *
 * THE ONE THING TO GET RIGHT HERE
 * The page re-skins via CSS custom properties with a `transition` on
 * `background-color`/`color` (see globals.css). So the switch costs ONE
 * attribute write and the browser cross-fades the entire site on the
 * compositor. There is no re-render of any styled component, and no
 * `gsap.from("body", {opacity: 0})` flash — which is the usual hack, and which
 * momentarily blanks the whole page including the thing you just clicked.
 *
 * Note `mix-blend-difference` on the parent header inverts these swatches too,
 * so `isolation: isolate` is applied to opt this one subtree back out of the
 * blend — otherwise the colour dots would show as their inverse and the
 * control would be lying about what it does.
 */
export default function ThemeSwitcher() {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className="flex items-center gap-2 isolate"
    >
      {THEMES.map((t) => (
        <button
          key={t.name}
          type="button"
          role="radio"
          aria-checked={theme === t.name}
          aria-label={`${t.label} theme`}
          title={t.label}
          onClick={() => setTheme(t.name)}
          className={cn(
            "h-4 w-4 rounded-full transition-transform duration-300 ease-[var(--ease-hop)]",
            "hover:scale-125 focus-visible:scale-125",
            theme === t.name
              ? "scale-100 ring-2 ring-offset-2 ring-current ring-offset-transparent"
              : "scale-90 opacity-70",
          )}
          style={{ backgroundColor: t.swatch }}
        />
      ))}
    </div>
  );
}
