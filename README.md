# OUTFIT® — award-site replica

A study replica of [OUTFIT® by ++hellohello](https://outfit.hellohello.is/)
(Awwwards Site of the Day), built to document how this class of site is made.

**→ [`GUIDE.md`](GUIDE.md) is the main deliverable**: a full breakdown of every
technique, from the loader to scroll triggers to page transitions, including the
React + GSAP traps that cost real debugging time while building it.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 (CSS-first, no config file) |
| Animation | GSAP 3.15 — ScrollTrigger, SplitText, CustomEase, Flip, Observer |
| Smooth scroll | Lenis, driven from `gsap.ticker` |
| Transitions | `next-transition-router` + GSAP curtain |
| State | zustand (module-scoped, survives routing) |

## Run

```bash
bun install     # or npm install
bun dev         # http://localhost:3000
bun run build && bun start
```

## Layout

```
data/data.ts              all copy, products, theme tokens, motion constants
lib/gsap.ts               single plugin-registration point + named eases
lib/lenis.ts              typed singleton handle on the scroll instance
store/                    theme · intro · cart
providers/                ThemeProvider · TransitionProvider
components/               layout · home · ui · shop
app/                      layout · page · shop · product/[slug] · about
                          · contact · bag · not-found
```

## What is implemented

- **Intro** — six fanned cards, `mix-blend-difference` wordmark, parallel
  counter, clip-path curtain, handing off to the hero through a shared master
  timeline so the two overlap.
- **Scroll** — pinned word-by-word scrub, 1:1 mapped horizontal section with
  `containerAnimation` parallax, differential-strength parallax lookbook,
  count-up stats, masked `SplitText` reveals throughout.
- **Transitions** — GSAP curtain with origin flip, scroll reset while closed,
  `ScrollTrigger.refresh()` on arrival.
- **Themes** — three skins as CSS custom-property sets swapped by `[data-theme]`,
  persisted, with a synchronous inline script so there is no flash of the wrong
  theme before hydration.
- **Commerce** — product grid with GSAP Flip filtering, 8 statically prerendered
  product routes, working cart and bag.
- **Accessibility** — nothing hidden in server HTML and revealed by JS;
  `prefers-reduced-motion` lands content in its end state rather than disabling
  reveals; `radiogroup` semantics, `aria-live`, `inert`, `SplitText` `aria`.

## Notes on fidelity

The original site, Awwwards and landing.love are all blocked by this
environment's network egress policy, so the original could not be loaded and
traced. This is a reconstruction from its documented design system, its real
copy, one confirmed real product (*Whitespace Matters*, $33), and the technique
catalogue the genre is built from — "how to build a site like this", not a
pixel-diff. See the note at the top of `GUIDE.md`.

Product photography in `public/` ships with the repo. Product names and copy
beyond the confirmed items are invented.
