# How award-winning sites are actually built

A complete breakdown of this replica of [OUTFIT® by ++hellohello](https://outfit.hellohello.is/)
(Awwwards Site of the Day). Every technique below is implemented in this repo —
file references are clickable.

> **On fidelity:** `outfit.hellohello.is`, `awwwards.com` and `landing.love` are
> all blocked by this environment's network egress policy, so I could not load
> the original to trace it. This is a faithful reconstruction from its
> documented design system (the cream/red, black/cream and white/blue skins; the
> full-bleed `Outfit` wordmark; the six-card preloader), its real copy and one
> confirmed real product (*Whitespace Matters*, $33), plus the technique
> catalogue the genre is built from. Treat it as "how to build a site like this",
> not a pixel-diff of that exact page.

---

## 0. The mental model

Award sites are not "normal sites with animations bolted on". Three ideas
separate them:

1. **The scroll is an instrument, not a scrollbar.** Position in the document
   drives animation progress. The visitor is playing the page.
2. **Motion is choreographed, not decorated.** Things overlap deliberately.
   Nothing simply "fades in on entry".
3. **Type is the artwork.** Huge, tight, edge-to-edge, and revealed through
   masks rather than opacity.

Everything below serves one of those three.

---

## 1. Project shape, and why

```
data/data.ts                    all copy, products, theme tokens, motion constants
lib/gsap.ts                     the ONE place plugins register + named eases
lib/lenis.ts                    typed singleton handle on the scroll instance
store/  theme | intro | cart    zustand, module-scoped so it survives routing
providers/  Theme | Transition  cross-cutting wrappers
components/ layout | home | ui | shop
app/  layout · page · shop · product/[slug] · about · contact · bag · not-found
```

**Why a `data.ts`.** Animation code is dense. If copy lives inside it, every
text tweak risks breaking a stagger. With content extracted, components are
purely motion + layout, and swapping this file for a CMS or Shopify fetch later
is a one-import change because the exported *types* are the contract.

**Why one GSAP module** ([`lib/gsap.ts`](lib/gsap.ts)). `registerPlugin` must run
before any component uses a plugin. Ten components each registering it "works"
but is order-dependent — if a component that *uses* ScrollTrigger renders before
the module registering it is imported, the animation silently no-ops. One module
everyone imports removes that whole bug class. It is also where `CustomEase`
curves become global names, so `ease: "hop"` works anywhere with no import.

---

## 2. The theme system

Three full-page skins, switched at runtime, with no re-render and no flash.

### 2.1 Tokens, not variants

The naive approach writes every theme on every element:

```tsx
<div className="cream:bg-[#ede4dd] dark:bg-black blue:bg-white ...">  // ✗
```

That does not survive a fourth theme. Instead
([`app/globals.css`](app/globals.css)) each theme is a *token set*:

```css
@theme {                          /* Tailwind v4: declares tokens AND utilities */
  --color-bg: var(--c-bg);        /* now `bg-bg` and `text-fg` exist */
  --color-fg: var(--c-fg);
}
:root, [data-theme="cream"] { --c-bg: #ede4dd; --c-fg: #ff0001; }
[data-theme="dark"]         { --c-bg: #050505; --c-fg: #ede4dd; }
[data-theme="blue"]         { --c-bg: #ffffff; --c-fg: #0040ff; }
```

Utilities compile **once**. Switching themes writes one attribute and the whole
page re-skins on the compositor. `body` has a `transition` on
`background-color`/`color`, so it cross-fades for free — no
`gsap.from("body", {opacity: 0})` hack, which momentarily blanks the page
*including the control you just clicked*.

Tailwind v4 has no `tailwind.config.js`. `@theme` declares tokens,
`@custom-variant` declares variant prefixes, `@utility` declares utilities. It
is all CSS.

### 2.2 No flash of the wrong theme

The server cannot know the visitor's saved preference, so it renders a default.
Correcting that in `useEffect` means the visitor *sees* cream for one frame and
watches it snap to dark. The fix is a synchronous inline script in `<head>`
([`app/layout.tsx`](app/layout.tsx)) that runs while the browser parses HTML,
before the first paint:

```tsx
<html data-theme="cream" suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{ __html: `
    (function(){try{var t=localStorage.getItem("outfit-theme");
      if(t)document.documentElement.setAttribute("data-theme",t)}catch(e){}})()
  `}} /></head>
```

Three details that matter: `suppressHydrationWarning` (the script changed the
DOM before React looked at it), the `try/catch` (localStorage throws in Safari
private mode), and a store whose initial value reads *the same key* so React's
first client render already agrees with the DOM.

### 2.3 `mix-blend-difference` — the nav that is always legible

The header crosses cream, black photography and blue panels. Rather than
per-section colour logic, the whole header is `mix-blend-difference`: it inverts
whatever is behind it. Two hard rules:

- The blended element must **not** sit inside anything with its own background,
  or it blends against that instead of the page. This is why `<Navbar/>` is a
  direct child of `<body>`, outside the transition wrapper.
- It must have **no background of its own** — a background is what it would
  blend against.

The trade-off is real: over mid-tone photography the inverse can land at low
contrast. The original site accepts this; so does this build. If you need a
guarantee, put a `backdrop-blur` scrim behind the nav instead and lose the
effect.

---

## 3. The loader

[`components/layout/Preloader.tsx`](components/layout/Preloader.tsx)

### 3.1 What a loader is actually for

Not waiting for assets — a Next.js page is usually interactive long before a
3-second loader ends. It buys two things: **a window where nothing scrolls**, so
the hero's entrance can be choreographed instead of racing hydration; and the
one moment you control completely. Call it an *intro*.

### 3.2 Structure

| Beat | What happens | The detail that matters |
|---|---|---|
| **A. Cards in** | 6 portrait cards scale `0 → 1`, staggered | `rotation: "random(-15,15)"` — GSAP parses that string natively, no `Math.random()` loop |
| **B. Wordmark** | `Outfit` rises out of a per-character mask | `stagger: {from: "random"}` is the entire personality; sequential reads as ordinary |
| **C. Counter** | `000 → 100` | inserted at position `0` so it runs **in parallel** with everything. A counter that finishes early looks broken |
| **D. Exit** | cards collapse `from: "end"`, wordmark exits upward, panel wipes | `clipPath: inset(0 0 100% 0)` — a fade would show both layers at once and look muddy |

### 3.3 Choreography: the position parameter

The third argument to `.to()`/`.from()` is the single most useful thing in GSAP:

```
"<"      align with the previous tween's START
">"      align with the previous tween's END
"<0.3"   0.3s after the previous tween's start
"-=0.5"  0.5s before the timeline's current end  → OVERLAP
1.2      absolute time on this timeline
```

Overlap is the difference between "choreographed" and "queued".

### 3.4 The hand-off, and why it is a shared timeline

The hero's headline should start rising **while** the curtain is still lifting.
Two independent timelines cannot reliably overlap — you would have to guess the
first one's duration. So a master timeline lives in a store
([`store/intro.store.ts`](store/intro.store.ts)); the preloader appends its
sequence, the hero appends its own at a known offset. Both components stay
independent and the choreography is exact.

The hero owns *creating* it, because the hero exists on every visit while the
preloader unmounts — whoever always exists should own the shared object.

### 3.5 Why it must not replay

`introDone` lives in **module state** (zustand), not React state. A provider
holding this in state re-mounts on some navigations and re-triggers the intro.
Module scope survives every client-side route change and resets only on a true
hard reload — exactly the semantics you want.

### 3.6 A real asset-gated loader

If you genuinely need one, the rules are: **always handle `onerror`** (one 404
otherwise hangs your site forever), **always keep a hard timeout** that forces
the exit, and **never gate on below-the-fold assets**. Sketch at the bottom of
`Preloader.tsx`.

---

## 4. Smooth scroll — and wiring it to ScrollTrigger

[`components/layout/SmoothScroll.tsx`](components/layout/SmoothScroll.tsx)

Lenis does not scroll the document. It intercepts wheel/touch events, keeps its
own animated value, and applies it as a transform. So the native `scroll` event
no longer reflects the visual position, and ScrollTrigger — which listens for
that event — ends up a frame behind. Pinned sections jitter; scrubbed animations
lag.

**All three lines are required:**

```ts
lenis.on("scroll", ScrollTrigger.update);          // 1. push Lenis → ScrollTrigger
gsap.ticker.add((t) => lenis.raf(t * 1000));       // 2. ONE rAF loop for the site
gsap.ticker.lagSmoothing(0);                       // 3. never fake elapsed time
```

- **(1)** without it, ScrollTrigger reads a stale position.
- **(2)** GSAP's ticker becomes the single clock, so Lenis and GSAP always agree
  what "this frame" means. Pair it with `autoRaf: false` on the Lenis config or
  you get two competing loops. The `× 1000` is seconds → milliseconds.
- **(3)** GSAP normally "protects" you after a long frame by pretending less
  time passed. For scroll-linked animation that is exactly wrong — it
  desynchronises scroll position from animation progress.

Two more things that are easy to miss:

- **`ScrollTrigger.refresh()` on `load`.** ScrollTrigger measures the document
  once and caches it. Images decoding and fonts swapping change the page height
  afterwards, and every trigger's start/end is then wrong.
- **Lock scrolling with `lenis.stop()`, never `overflow: hidden`.** Toggling
  overflow changes whether a scrollbar exists, which reflows the page — which on
  a pinned page means ScrollTrigger recalculates mid-intro.
- **Leave real touch scrolling alone** (`syncTouch: false`). No JS matches the
  OS's momentum physics, and hijacking it is the top cause of "this site feels
  broken on my phone".

> **Next 16 note:** Next no longer rewrites `scroll-behavior` during route
> changes unless you opt in with `data-scroll-behavior="smooth"` on `<html>`.
> Here we want Lenis to own scrolling entirely, so we set neither.

**Alternative:** GSAP ships `ScrollSmoother` (free since 3.13), which is built
for ScrollTrigger and needs none of the above wiring. Lenis is used here because
it is smaller and framework-agnostic. Either is a defensible choice; do not run
both.

---

## 5. Text reveals

[`components/ui/AnimatedText.tsx`](components/ui/AnimatedText.tsx)

### 5.1 The masked reveal

Text on these sites does not fade. Each line/word/char sits in an
`overflow: hidden` box and starts translated **100% down** — entirely outside its
own mask. Animating to `0` makes it rise out of nothing with a hard edge. That
edge is the effect: a fade looks soft and cheap, a mask looks typeset.

`SplitText`'s `mask: "lines"` builds those wrappers for you.

### 5.2 `autoSplit` + `onSplit` (GSAP 3.13+) — do not skip this

Splitting by **line** is a measurement: it depends on the element's width and on
the font being loaded. Two things break a naive split:

1. the web font swaps in after splitting → lines re-wrap → masks are in the
   wrong places and text is clipped mid-word;
2. the viewport resizes → same problem.

`autoSplit: true` re-splits on font load and resize. But a re-split destroys the
nodes your tween was animating, so the animation must be **rebuilt** — that is
what `onSplit` is for. Returning the timeline from `onSplit` lets SplitText kill
the previous one, avoiding a dozen orphaned timelines fighting over dead nodes.

```ts
SplitText.create(el, {
  type: "lines", mask: "lines", autoSplit: true, aria: "auto",
  onSplit: (self) => gsap.from(self.lines, {
    yPercent: 110, stagger: { amount: 0.5, from: "random" }, ease: "hop",
    scrollTrigger: { trigger: el, start: "top 85%", once: true },
  }),
});
```

Build the ScrollTrigger **inside** `onSplit` too, so a re-split re-measures it.

### 5.3 `smartWrap` is mandatory for char splits

A char split makes every glyph an inline-block, which destroys the browser's
notion of a word — so it will break a line **between two letters**. You get
`"Whitespac / e Matters"`, and it reads as a rendering bug because it is one.
`smartWrap: true` wraps each word in a `nowrap` span, restoring word integrity
while leaving `self.chars` animatable. (This repo hit exactly this bug; see the
before/after in the commit.)

### 5.4 Accessibility

Splitting shatters text into dozens of spans, which screen readers may read
letter-by-letter. `aria: "auto"` restores a readable label on the parent: the
DOM can be confetti while the accessibility tree stays a sentence.

---

## 6. Scroll triggers

### 6.1 Reading `start` and `end`, once and for all

```
start: "top 85%"
        │    └── position in the VIEWPORT   (0% = top of screen)
        └─────── position on the TRIGGER ELEMENT
```

> *"This starts when the **top** of the element reaches the point **85%** down
> the viewport."*

| Value | Fires when | Good for |
|---|---|---|
| `"top bottom"` | the element's first pixel appears | full passes |
| `"top 85%"` | just inside the fold | **reveals** |
| `"center center"` | element centred | **pinning** |
| `"bottom top"` | element fully past | exits |

Offsets work too: `"top 85%+=100"`, `"top bottom-=200"`.

**Use `markers: true` constantly while building.** It draws all four lines on
screen and turns scroll animation from guesswork into reading a ruler.

### 6.2 `once` vs `toggleActions`

`once: true` plays a reveal one time then destroys the trigger — cheapest, and
correct for content, because an element re-hiding itself when you scroll back up
is disorienting. `toggleActions: "play reverse play reverse"` maps to
`onEnter onLeave onEnterBack onLeaveBack` and belongs on decorative things.

### 6.3 `scrub` — giving the visitor the wheel

`scrub: true` binds animation progress to scroll progress. The visitor can stop
halfway, reverse, scrub back and forth. That agency is the point; a timed
animation triggered on entry is a video, not an interaction.

`scrub: 1` makes progress *chase* scroll with ~1s of smoothing — almost always
what you want with a smooth-scroll library, because it adds weight and hides
single-frame jitter.

**Scrubbed tweens must use `ease: "none"`.** The scroll is the easing; an ease on
top fights it.

### 6.4 Pinning

[`components/home/Manifesto.tsx`](components/home/Manifesto.tsx) — a block of
text locked centre-screen while scroll fills its words in one at a time.

`pin: true` does **not** use `position: sticky`. ScrollTrigger measures the
element, wraps it in a `pin-spacer` of the same size, switches the element to
`position: fixed`, and grows the spacer so the document stays long enough.
Consequences you must design around:

- **`end: "+=150%"`** means "pin for 150% of the viewport height of scrolling".
  That number *is* the section's length. 100% is brisk; beyond ~300% it feels
  like a hostage situation.
- **An ancestor with `overflow: hidden` breaks pinning** (a fixed child cannot
  escape it), and **an ancestor with a `transform` breaks it too** (a transform
  creates a containing block, so `fixed` becomes relative to it). This is the #1
  reason "pin doesn't work" — it is nearly always an ancestor, not the trigger.
  It is also why the page-transition wrapper in this repo clears its inline
  transform when the enter animation ends.
- **`anticipatePin: 1`** applies the pin one frame early. Without it, fast
  scrolling with smooth scroll shows a visible one-frame jump.
- **`invalidateOnRefresh: true`** re-measures on resize. Without it, rotating a
  phone leaves the spacer at the old height and sections overlap.

### 6.5 Horizontal scroll

[`components/home/HorizontalScroll.tsx`](components/home/HorizontalScroll.tsx)

Nothing actually scrolls horizontally. The section is pinned and vertical input
is translated into an `x` tween on an inner track.

```ts
xPercent: -100 * (panels - 1)                       // the formula
end: () => "+=" + (track.offsetWidth - innerWidth)  // 1:1 pixel mapping
```

Each panel is `100vw`, so the track is `panels × 100vw` wide. `xPercent` is
relative to the *track's* width, so you want `(panels − 1)` panel-widths of
travel — with 4 panels, `-300%`. Setting the scroll distance to the real pixel
overflow makes one pixel of vertical scroll move the track one pixel sideways;
any other value makes the motion faster or slower than the visitor's gesture,
which feels wrong even when people cannot say why.

**Nested scrubs need `containerAnimation`.** To parallax each panel's image as
it crosses the screen, a trigger must observe the element's position *inside the
tweened track* rather than inside the viewport — otherwise every panel fires at
once, because they are all technically "in view" the whole time the section is
pinned.

**Wrap it in `gsap.matchMedia()`.** Horizontal hijacking is hostile on a phone.
`matchMedia` builds the animation only on desktop *and reverts it* if the
viewport crosses the breakpoint mid-session — a plain
`if (window.innerWidth > 768)` leaves a dead pinned section behind on resize.
On mobile the same markup degrades to a native swipe strip with scroll snap.

### 6.6 Parallax without gaps

[`components/ui/ParallaxImage.tsx`](components/ui/ParallaxImage.tsx)

Move a correctly-sized image and it slides out of its own frame. The fix is the
whole technique: **give the inner image more height than the frame** (120%),
then animate between `-10%` and `+10%` — it never runs out of material.

Use `yPercent`, not `y` or `top`:

| | cost | problem |
|---|---|---|
| `top` | layout every frame | janky |
| `y` | transform | pixel-based, so strength changes with viewport |
| `yPercent` | transform | relative to the element's own height → identical everywhere |

And **vary it**: uniform parallax is nearly invisible; *differential* parallax
(adjacent items drifting at different rates, some negative) is what the eye
reads as depth. See [`Lookbook.tsx`](components/home/Lookbook.tsx).

### 6.7 Count-ups

Never animate `textContent`. Tween a **number** on a plain object and render it
in `onUpdate` ([`Stats.tsx`](components/home/Stats.tsx)). `snap: { value: 1 }`
keeps it integral. Add `tabular-nums` — proportional digits have different
widths, so a counter visibly jitters as it reflows.

---

## 7. Page transitions

[`providers/TransitionProvider.tsx`](providers/TransitionProvider.tsx)

In the App Router, clicking a `<Link>` swaps the page as soon as the RSC payload
arrives. There is no built-in "animate the old page out first", so a library has
to sit between the click and the navigation:

```
click → [ leave animation ] → next() → React swaps → [ enter animation ]
```

`next-transition-router` provides those two hooks; `auto` patches every
`next/link` so you keep your imports.

### 7.1 The curtain

One full-screen div, scaled on Y:

```
LEAVE   transformOrigin: bottom,  scaleY 0 → 1   (rises from the bottom)
ENTER   transformOrigin: top,     scaleY 1 → 0   (retracts out the top)
```

**Moving the origin between the halves is the entire illusion** — it reads as one
continuous sheet travelling up the screen rather than a panel that grows and
shrinks back. Scale, not `height`: scale is a compositor operation, so it holds
60fps precisely when the main thread is busy parsing the incoming payload.

The outgoing page also scales to `0.94` and dims. That "push back" gives the
transition depth: the old page recedes, the curtain passes in front of it.

### 7.2 The two things everyone forgets

1. **Scroll position.** The new page mounts at the old page's scroll offset.
   Reset it **while the curtain is closed**, in the gap between leave and enter,
   or the visitor watches the page jump. And because Lenis owns scrolling,
   `window.scrollTo` alone is not enough — reset both
   ([`lib/lenis.ts`](lib/lenis.ts)).
2. **ScrollTrigger state.** Every trigger on the outgoing page cached pixel
   values for a document that no longer exists. Call `ScrollTrigger.refresh()`
   after the enter animation. Skip this and you get the classic symptom:
   *animations that work on reload but not after an in-app navigation.*

Also clear GSAP's inline transform on the page wrapper when you are done —
a leftover `transform` creates a containing block and silently breaks
`position: fixed` children and any pinning inside the new page (§6.4).

### 7.3 Alternative: React `<ViewTransition>`

Next 16 supports React's `<ViewTransition>` behind
`experimental: { viewTransition: true }`. Wrap two elements on different routes
in the same `name` and the browser morphs between their positions — genuinely
better for *shared-element* transitions (a grid thumbnail growing into a hero
image), and far less code. It is weaker when you want a fully art-directed
curtain with its own timing, which is why this build uses GSAP. They compose:
curtain for route changes, `<ViewTransition>` for shared elements.

---

## 8. Pointer interactions

### 8.1 `quickTo`, not `gsap.to` — the single biggest performance lever

`mousemove` fires up to 120×/s.

```ts
gsap.to(el, { x, y })                              // ✗ a new tween object per event
const moveX = gsap.quickTo(el, "x", { duration: .5 });  // ✓ ONE reusable tween
moveX(value);                                      // just re-targets it
```

`gsap.to` allocates, inserts into the global timeline, and garbage-collects —
dozens of times per second. It works, and it is the #1 source of "why does this
site heat up my laptop". `quickTo` was added for exactly this.

The `duration` on `quickTo` *is* the elasticity: the element is always easing
toward the cursor rather than tracking it rigidly, which is what makes it feel
physical.

### 8.2 Magnetic buttons

[`components/ui/MagneticButton.tsx`](components/ui/MagneticButton.tsx) —
normalise the cursor offset to `-1..1` so the pull is proportional regardless of
button size, and move the **label further than the button** (`× 0.6` extra) so
the text leads. That difference in travel is what sells it as depth rather than
a flat slide. Listen on the element, not the window, so nothing computes while
the cursor is elsewhere.

### 8.3 Custom cursor

[`components/layout/Cursor.tsx`](components/layout/Cursor.tsx). Four rules:

1. **Pointer devices only** — `(hover: hover) and (pointer: fine)`.
2. **Never hide the native cursor until the custom one is confirmed on screen.**
   Set the `cursor: none` flag only after the first real `mousemove`, so
   keyboard and touch visitors never lose their pointer.
3. **Two different follow speeds.** Dot `0.15s`, ring `0.55s`. The *difference*
   is the effect; matched speeds just look like a big cursor.
4. **One delegated listener**, with `e.target.closest("a, button, …")`, instead
   of binding every interactive element — works for content added later.

### 8.4 Marquees

[`components/ui/Marquee.tsx`](components/ui/Marquee.tsx)

Render the list **twice** in one track and translate by exactly `-50%`. At the
restart, copy #2 sits precisely where copy #1 began, so the seam is invisible.
Any other percentage stutters — this is why it must be two copies and `-50%`.

Do the loop in **CSS**: it runs on the compositor, keeps going while the main
thread is busy hydrating, and the browser pauses it off-screen. Use JS only for
the part that needs state — mapping `ScrollTrigger.getVelocity()` to `skewX` so
the strip appears dragged by the scroll. Clamp it (a trackpad flick reports
thousands of px/sec and would smear the text) and decay it back to zero.

> **The trap that costs an hour:** a running CSS animation on `transform` beats
> an inline `transform` set by JS. You cannot skew the same element that carries
> `animation: marquee-x`. Split them — one node for the CSS translate, a parent
> for the GSAP skew. **Exactly one owner of `transform` per element** is the
> general rule, and it bit this build twice (the marquee, and the cursor where
> Tailwind's `-translate-x-1/2` was silently wiped by GSAP's `x`; centring now
> uses GSAP's own `xPercent`).

### 8.5 Filtering a grid with Flip

[`app/shop/page.tsx`](app/shop/page.tsx)

Filter a grid and React re-renders instantly: items teleport. There is nothing
to animate, because by the time you could, the DOM is final.

**FLIP** = First, Last, Invert, Play:

1. **First** — record positions *before* the change (`Flip.getState()`)
2. **Last** — let React re-render
3. **Invert** — transform each item back to where it visually was
4. **Play** — animate those transforms to zero

Order is everything: `getState()` before the state update commits, `Flip.from()`
after. `useGSAP` runs as a **layout** effect — after the DOM mutation, before
paint — which is exactly the window needed. `useEffect` would paint the
un-inverted frame first and you would see a flicker. Use `data-flip-id` for
identity: Flip works on DOM nodes, not the React tree, so a `key` is not enough.

---

## 9. Performance

| Rule | Why |
|---|---|
| Animate `transform` and `opacity` only | anything else triggers layout or paint every frame |
| `yPercent`/`xPercent` over `y`/`x` | resolution-independent effect strength |
| `quickTo`/`quickSetter` for pointer + per-frame writes | zero allocation per event |
| `will-change` is a promise, not decoration | each one costs a compositor layer; add and remove it around a tween |
| `once: true` where possible | destroys the trigger after firing |
| CSS for infinite decorative loops | compositor-driven, survives a busy main thread |
| `ease: "none"` on scrubbed tweens | the scroll is the easing |
| `ScrollTrigger.config({ ignoreMobileResize: true })` | iOS's collapsing address bar otherwise counts as a resize and re-measures every trigger |
| `autoAlpha` over `opacity` | also flips `visibility`, so a transparent element stops swallowing clicks and leaving itself in the a11y tree |

Images: `next/image` with explicit `sizes`, `priority` only on what is genuinely
above the fold (the six intro cards, the first product image). Fonts: `next/font`
self-hosts at build time — no runtime request to Google, no layout shift.

> **Next 16 image changes worth knowing:** default `minimumCacheTTL` moved
> 60s → 4h; `images.qualities` now defaults to `[75]` only; `16` was dropped
> from default `imageSizes`; and local `src` with a query string now requires
> `images.localPatterns`.

---

## 10. Accessibility and resilience

This is what separates a site that wins an award from one that also deserves it.

**Never hide content in server HTML and reveal it with JS.** The pattern

```tsx
<body className="opacity-0">   // ✗ and a script fades it in
```

means a blank page forever if JS fails, errors, or is blocked. Everything here
renders **visible** server-side; animation only ever enhances. The navbar
follows the same rule: it ships visible and a *layout* effect hides it only when
an intro is genuinely about to play — layout effects run before paint, so there
is no flash, and the no-JS fallback is a working nav.

**`prefers-reduced-motion` must not simply disable animation.** `gsap.from()`
applies its start state immediately, so a blanket kill leaves elements stranded
at `opacity: 0` — you have hidden the content from the people who asked for
*less motion*, not none. Instead every component checks
`prefersReducedMotion()` and sets the **end** state
([`lib/gsap.ts`](lib/gsap.ts)). Verified: with reduced motion the intro is
skipped, the hero rule is full width, and the page scrolls.

Also in this build: `aria: "auto"` on every split, real `radiogroup` semantics
for the size and theme pickers, `aria-pressed` on filters, `aria-live` on the
newsletter confirmation, `inert` on the off-screen mobile menu (a `translate`
alone leaves it tabbable), `aria-hidden` on the duplicated marquee row, a focus
ring that survives all three themes, and a `notFound()` that returns a real 404
status instead of a 200 with sad markup.

---

## 11. Next.js 16 specifics

Read `node_modules/next/dist/docs/` — this version has genuine breaking changes.

- **`params` and `searchParams` are Promises.** Synchronous access is gone (not
  deprecated — gone). Same for `cookies()`, `headers()`, `draftMode()`, and the
  `params` given to `generateMetadata`, `icon`, `opengraph-image` and `sitemap`.
  ```tsx
  export default async function Page({ params }: { params: Promise<{slug: string}> }) {
    const { slug } = await params;
  }
  ```
- **Turbopack is the default** for `next dev` *and* `next build`. A custom
  `webpack` config now fails the build unless you pass `--webpack`.
- **`scroll-behavior` is no longer overridden** during navigation unless you add
  `data-scroll-behavior="smooth"` to `<html>`.
- `middleware` → `proxy`; PPR is now `cacheComponents`; `next lint` is gone in
  favour of the ESLint CLI.

**Server shell / client island.** [`product/[slug]/page.tsx`](app/product/%5Bslug%5D/page.tsx)
stays a Server Component — it does the data lookup, `notFound()`, metadata, and
`generateStaticParams` (all 8 product pages prerender at build time, which also
lets them be fully prefetched on hover). The interactive part lives in a
separate `"use client"` island. Reach for this split whenever a page is mostly
static with an interactive core.

---

## 12. The React + GSAP traps that actually bit this build

These cost real debugging time. They are the most valuable part of this document.

### 12.1 `useGSAP` does not revert between dependency changes

Read the source of `@gsap/react`: when `dependencies` is non-empty and
`revertOnUpdate` is falsy, **cleanup is deferred to unmount**. Each dependency
change simply *adds* the callback's animations to the same context again.

The hero had `introDone` in its dependencies. When the intro finished and the
flag flipped, the callback re-ran, **split the already-split wordmark a second
time** and created a second set of `from` tweens fighting the first — leaving the
rule bar stranded at 5% width and the meta text invisible. Two defences: read
such flags with `useIntroStore.getState()` instead of subscribing, and guard the
build with a ref so it is idempotent.

### 12.2 A zustand selector that builds a new object loops forever

```ts
const lines = useCartStore((s) => s.lines.map(join));   // ✗ infinite loop
```

zustand v5 sits on `useSyncExternalStore`, which compares snapshots with
`Object.is`. A selector returning a fresh array hands React a reference it has
never seen → re-render → new array → re-render. That is React error **#185**,
"Maximum update depth exceeded", from a selector that looks completely
innocent. Fix: return primitives, or select raw state and derive in `useMemo`
(what [`app/bag/page.tsx`](app/bag/page.tsx) does), or wrap in `useShallow`.

Related: always select the *slice* you need. `useCartStore()` with no selector
re-renders on every cart change anywhere in the app.

### 12.3 Route-dependent state in a store causes hydration errors

Seeding the intro store from `window.location.pathname` looked clever — hard
loads of `/shop` would skip the intro. But `window` does not exist during SSR,
so the server computed "no intro" (preloader renders `null`) and the client
computed "intro" (preloader renders a full-screen panel). React saw two
different trees, threw hydration error **#418**, and re-rendered the subtree on
the client.

The fix is a principle: **store initial state must be identical on server and
client.** Route-dependent questions belong to the components that can answer
them — the navbar asks `usePathname()`, the preloader takes the scroll lock on
mount.

### 12.4 Defaults must fail safe

The same bug from the other side: with `scrollLocked: true` as the default, a
hard load of any route *without* a preloader left **Lenis permanently stopped** —
the page could not scroll at all, because the only thing that releases the lock
was not on the page. The default must be the working page; only a preloader that
actually mounted may take scrolling away.

### 12.5 Measure what you think you are measuring

`fitty` collapsed the Studio heading to its `minSize`. Its entire algorithm is
`newSize = parent.clientWidth / element.scrollWidth × fontSize`, and **both
operands were wrong**: `w-full` made the element's `scrollWidth` report the
container width (ratio ≈ 1, "it already fits"), and `clientWidth` *includes
padding*, so measuring against the padded `.edge` header would have overshot the
gutters by 80px. Fix: no width class on the fitted element, and an unpadded
wrapper as its parent. It now computes 107.19px and fills 1359 of 1360px.

---

## 13. Running it

```bash
bun install        # or npm install
bun dev            # http://localhost:3000
bun run build && bun start
```

**Build it yourself in this order.** Each step is visible before you add the
next, which is the only way to keep the motion debuggable:

1. Static layout and type scale. No animation at all.
2. Lenis + the three-line ScrollTrigger wiring (§4).
3. `AnimatedText` and `ScrollReveal` — get reveals right everywhere (§5, §6.1).
4. The preloader and the master-timeline hand-off (§3).
5. One set piece: the pinned scrub *or* the horizontal section (§6.4, §6.5).
6. Page transitions (§7).
7. Pointer polish: magnetic buttons, cursor, marquee velocity (§8).
8. Reduced motion, keyboard, no-JS pass (§10) — before you call it done.

Turn on `markers: true` in step 3 and leave it on until step 6.

---

## What I would do differently at production scale

- **Products from a real backend.** `data.ts` is deliberately shaped so this is
  an import swap; `getProductBySlug` becomes async and the page already awaits.
- **Higher-resolution art.** The bundled images are 256×341, fine for cards but
  soft full-bleed. The lookbook wants 2000px+ originals.
- **Shared-element transitions** between the shop grid and the product hero via
  React `<ViewTransition>` (§7.3) — the one place the curtain is the weaker tool.
- **A motion spec document.** Once more than one person touches the code, the
  constants in `MOTION` need prose explaining *intent*, or they drift.
