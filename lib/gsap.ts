/**
 * ============================================================================
 *  lib/gsap.ts — ONE place where GSAP is configured.
 * ============================================================================
 *
 *  Why centralise this?
 *
 *  1. `gsap.registerPlugin()` must run before any component uses a plugin, and
 *     it must run exactly once. Sprinkling `registerPlugin(ScrollTrigger)` at
 *     the top of ten components "works" but it is order-dependent: if a
 *     component that *uses* ScrollTrigger renders before the module that
 *     registers it has been imported, you get a silent no-op animation. One
 *     module that everything imports removes that class of bug entirely.
 *
 *  2. Plugins are client-only (they touch `window`). Importing them from a
 *     single "use client" module means a stray server-component import
 *     produces one obvious error instead of a confusing SSR crash.
 *
 *  3. CustomEase curves are *global named eases*. Creating them here means
 *     `ease: "hop"` works in any component with no import.
 *
 *  GSAP 3.13+ note: SplitText, CustomEase, ScrollSmoother, Flip, Observer et al
 *  are all in the free package now. The canonical import path is
 *  `gsap/SplitText` (not `gsap/src/SplitText` — that path resolves too, but
 *  `gsap/<Plugin>` is the documented entry and carries the bundled types).
 */
"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";
import { Observer } from "gsap/Observer";
import { Flip } from "gsap/Flip";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

/**
 * `registerPlugin` is safe to call more than once (GSAP de-dupes internally),
 * but we still guard so the CustomEase definitions below only run once.
 */
let registered = false;

export function registerGsap() {
  if (registered) return;
  registered = true;

  gsap.registerPlugin(
    ScrollTrigger,
    SplitText,
    CustomEase,
    Observer,
    Flip,
    ScrollToPlugin,
  );

  /* -----------------------------------------------------------------------
   * NAMED EASES
   * ---------------------------------------------------------------------
   * These are cubic beziers expressed as CustomEase strings. The numbers are
   * the two control points of a normalised 0→1 curve.
   *
   *  hop    0.9, 0, 0.1, 1   — brutal. Sits still, snaps, stops dead. This is
   *                            *the* award-site easing: because both control
   *                            points are pinned to the extremes, the middle
   *                            of the motion is extremely fast and the ends
   *                            are extremely slow, which reads as "expensive".
   *  glide  0.8, 0, 0.2, 1   — the same shape, relaxed. For large surfaces
   *                            (curtains, clip-path wipes) where `hop` would
   *                            look twitchy.
   *  drift  0.25, 0, 0.35, 1 — nearly linear with a soft landing, for things
   *                            that should feel mechanical (counters, tickers).
   */
  CustomEase.create("hop", "0.9,0,0.1,1");
  CustomEase.create("glide", "0.8,0,0.2,1");
  CustomEase.create("drift", "0.25,0,0.35,1");

  /* -----------------------------------------------------------------------
   * GLOBAL DEFAULTS
   * ---------------------------------------------------------------------
   * Setting defaults here means individual tweens stay short and consistent.
   * Anything can still override per-tween.
   */
  gsap.defaults({
    ease: "hop",
    duration: 0.9,
  });

  /* -----------------------------------------------------------------------
   * ScrollTrigger CONFIG
   * ---------------------------------------------------------------------
   * `ignoreMobileResize` stops iOS Safari's collapsing address bar from
   * counting as a resize — without it, every scroll direction change on
   * mobile re-calculates every trigger and pinned sections visibly jump.
   */
  ScrollTrigger.config({
    ignoreMobileResize: true,
  });

  /* -----------------------------------------------------------------------
   * REDUCED MOTION
   * ---------------------------------------------------------------------
   * We deliberately do NOT kill animation globally: `gsap.from()` tweens set
   * their start state immediately, so a global kill leaves elements stuck
   * invisible at `opacity: 0`. Instead components read `prefersReducedMotion()`
   * (below) and collapse durations to ~0 — the element still lands in its
   * final state, it just gets there instantly.
   */
}

/** Single shared matchMedia instance for responsive/reduced-motion contexts. */
export const mm = gsap.matchMedia();

/** Breakpoints mirrored from Tailwind so JS and CSS agree on "mobile". */
export const MQ = {
  reduce: "(prefers-reduced-motion: reduce)",
  motion: "(prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px)",
  desktop: "(min-width: 768px)",
} as const;

/** True when the user asked for less motion. Read at animation build time. */
export function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MQ.reduce).matches;
}

export { gsap, ScrollTrigger, SplitText, CustomEase, Observer, Flip };
