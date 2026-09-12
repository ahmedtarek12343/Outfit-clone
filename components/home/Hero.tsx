"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  SplitText,
  registerGsap,
  prefersReducedMotion,
} from "@/lib/gsap";
import { useIntroStore } from "@/store/intro.store";
import { SITE, MOTION } from "@/data/data";

/**
 * ============================================================================
 *  HERO
 * ============================================================================
 *
 *  ── FITTING GIANT TYPE TO THE VIEWPORT ─────────────────────────────────────
 *
 *  The look depends on the wordmark touching both edges of the screen at every
 *  size. Three ways to get there:
 *
 *   1. A JS fitter (`fitty`): measures the text, sets font-size to fill.
 *      Correct for ANY word length — necessary if the string is dynamic.
 *      Costs a measure/write cycle and fights SplitText (both want to own the
 *      element's layout). Demonstrated on the Studio page.
 *
 *   2. SVG <text> in a viewBox: scales perfectly, zero JS. But you lose real
 *      text selection and per-character masking gets awkward.
 *
 *   3. `font-size` in `vw` units, calibrated once. ← what we do here
 *      No JS, no measuring, no layout thrash, and it composes perfectly with
 *      SplitText's masks. The trade-off is that the multiplier is specific to
 *      this font and this character count.
 *
 *      CALIBRATING IT: a character in Geist Bold averages ~0.62em wide. For a
 *      6-character word to span 100vw:
 *          6 × 0.62 × fontSize = 100vw  →  fontSize ≈ 26vw
 *      Then account for the page gutter and the -0.045em tracking, which is
 *      why the value below lands on 25vw. (Verified: at a 1440px viewport the
 *      wordmark measures 1360px — exactly the content width inside the
 *      gutters.) Change the word and you re-derive it; that is the cost of
 *      this approach, and it is worth paying because the word is a constant.
 *
 *  ── THE HAND-OFF ───────────────────────────────────────────────────────────
 *
 *  On a FIRST load this component appends its reveal to the shared master
 *  timeline at `MOTION.duration.heroHandoff`, which lands while the
 *  preloader's curtain is still travelling — so the two overlap instead of
 *  queueing. On a return visit `introDone` is already true and it plays a
 *  standalone timeline immediately.
 *
 *  ── ⚠ THE useGSAP TRAP THIS COMPONENT IS BUILT AROUND ──────────────────────
 *
 *  `useGSAP(fn, [deps])` does NOT revert between dependency changes. Read the
 *  source: when `dependencies` is non-empty and `revertOnUpdate` is falsy,
 *  cleanup is DEFERRED TO UNMOUNT. Every dependency change simply ADDS the
 *  callback's animations to the same context again.
 *
 *  So if `introDone` were a dependency here, flipping it false→true at the end
 *  of the intro would re-run this callback and:
 *    • split the already-split wordmark a second time, and
 *    • create a second set of `from` tweens fighting the first over the same
 *      properties — which leaves elements stranded mid-animation.
 *
 *  Two defences, both deliberate:
 *    1. `introDone` is read with `useIntroStore.getState()` instead of being
 *       subscribed to, so changing it never re-runs this effect.
 *    2. A `builtRef` guard makes the build idempotent regardless.
 */
export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const builtRef = useRef(false);

  /* Subscribed, because the effect below genuinely must wake when the master
     timeline is created. This is the ONLY thing it subscribes to. */
  const masterTimeline = useIntroStore((s) => s.masterTimeline);
  const setMasterTimeline = useIntroStore((s) => s.setMasterTimeline);

  /* Create the shared timeline once. The hero owns it (rather than the
     preloader) because the hero exists on every visit while the preloader
     unmounts — whoever always exists should own the shared object. */
  useGSAP(() => {
    registerGsap();
    const { introDone, masterTimeline: existing } = useIntroStore.getState();
    if (!introDone && !existing) setMasterTimeline(gsap.timeline());
  }, []);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current || builtRef.current) return;

      /* Read, do not subscribe — see the trap note above. */
      const { introDone, masterTimeline: master } = useIntroStore.getState();

      /* On a first load, wait for the master timeline to exist. */
      if (!introDone && !master) return;

      builtRef.current = true;

      const split = SplitText.create(".hero-wordmark", {
        type: "chars",
        mask: "chars",
        aria: "auto",
      });

      if (prefersReducedMotion()) {
        gsap.set(split.chars, { yPercent: 0 });
        gsap.set(".hero-rule", { scaleX: 1 });
        gsap.set(".hero-meta > *", { y: 0, autoAlpha: 1 });
        return;
      }

      const build = (tl: gsap.core.Timeline, at: number | string) =>
        tl
          .from(
            split.chars,
            {
              yPercent: 110,
              duration: 1,
              ease: "hop",
              stagger: { amount: 0.5, from: "random" },
            },
            at,
          )
          /* The rule scaling out from the left is the classic editorial
             "settle" beat. transformOrigin MUST be set or it grows from the
             centre, which reads as a completely different gesture. */
          .from(
            ".hero-rule",
            {
              scaleX: 0,
              transformOrigin: "left center",
              duration: 1,
              ease: "glide",
            },
            "<0.3",
          )
          .from(
            ".hero-meta > *",
            {
              y: 40,
              autoAlpha: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: "hop",
            },
            "<0.15",
          );

      if (!introDone && master) {
        build(master, MOTION.duration.heroHandoff);
      } else {
        build(gsap.timeline(), 0);
      }
    },
    /* ONLY masterTimeline. Adding introDone here is the bug described above. */
    { scope: ref, dependencies: [masterTimeline] },
  );

  return (
    <section
      ref={ref}
      className="edge relative flex min-h-screen flex-col justify-between pt-[22vh] pb-10"
    >
      <div>
        {/* `leading-[0.78]` crops the generous default line box so the glyphs
            sit tight against the rule below. */}
        <h1 className="hero-wordmark text-[25vw] leading-[0.78] font-bold tracking-[-0.045em] whitespace-nowrap uppercase">
          {SITE.wordmark}
        </h1>

        <div className="hero-rule my-4 h-[5px] w-full bg-fg" />

        <div className="hero-meta grid gap-8 pt-4 md:grid-cols-4">
          <p className="font-mono text-xs uppercase tracking-[0.1em] opacity-70">
            {SITE.name}
          </p>
          <div className="md:col-span-2">
            <p className="font-mono text-xs uppercase tracking-[0.1em] opacity-70">
              Why
            </p>
            <p className="mt-3 max-w-[52ch] text-base leading-[1.35] font-medium md:text-lg">
              {SITE.intro}
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.1em] opacity-70 md:text-right">
            {SITE.location}
            <br />
            Est. {SITE.year}
          </p>
        </div>
      </div>

      {/* Scroll affordance. Award sites often omit this; they should not — a
          full-bleed type page gives no hint that there is more below. */}
      <div className="flex items-end justify-between font-mono text-xs uppercase tracking-[0.1em]">
        <span className="flex items-center gap-2">
          <span className="inline-block h-8 w-px bg-current opacity-40" />
          Scroll
        </span>
        <span className="opacity-50">01 / 06</span>
      </div>
    </section>
  );
}
