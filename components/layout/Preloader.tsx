"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  SplitText,
  registerGsap,
  prefersReducedMotion,
} from "@/lib/gsap";
import { useIntroStore } from "@/store/intro.store";
import { SITE, MOTION } from "@/data/data";
import { pad } from "@/lib/utils";

/**
 * ============================================================================
 *  THE PRELOADER
 * ============================================================================
 *
 *  WHAT A LOADER IS ACTUALLY FOR
 *  Not "waiting for assets" — a Next.js page is usually interactive long before
 *  a 3-second loader finishes. A loader on this kind of site buys two things:
 *
 *    1. A guaranteed window in which nothing is scrolling, so the hero's
 *       entrance can be choreographed instead of racing hydration.
 *    2. A first impression. It is the only moment you control completely.
 *
 *  So it is honest to call it an INTRO, not a loader. Ours runs on a fixed
 *  timeline. (If you genuinely need to gate on assets, see the note at the
 *  bottom of this file.)
 *
 *  ── THE FOUR-PART STRUCTURE ────────────────────────────────────────────────
 *
 *   A. CARDS IN     six portrait cards scale up from 0 at random rotations,
 *                   staggered. Random rotation is set BEFORE the tween with
 *                   gsap.set(..., "random(-15,15)") — GSAP parses that string
 *                   natively, no Math.random() loop needed.
 *   B. WORDMARK     "Outfit" rises out of a per-character mask.
 *   C. COUNTER      000 → 100, running in PARALLEL (position `0`) for the
 *                   whole intro, not sequentially. A counter that finishes
 *                   before the animation does looks broken.
 *   D. EXIT         cards collapse (from: "end" — reverse order, so it reads
 *                   as the same gesture rewinding), wordmark exits UPWARD
 *                   through its mask, then the whole panel wipes away with a
 *                   clip-path.
 *
 *  ── THE HAND-OFF: WHY A SHARED "MASTER" TIMELINE ───────────────────────────
 *
 *  The single biggest difference between a good intro and a great one is
 *  OVERLAP. The hero's headline should start rising while the curtain is still
 *  lifting — not after. Two independent timelines cannot reliably overlap,
 *  because you would have to guess the first one's duration.
 *
 *  So: a parent timeline is created once and put in a store. The preloader
 *  appends its sequence; the hero appends its own with a NEGATIVE offset
 *  ("-=0.55"), pulling itself back into the preloader's tail. Both components
 *  stay independent, and the choreography is exact.
 *
 *  ── WHY IT MUST NOT RE-PLAY ────────────────────────────────────────────────
 *
 *  `introDone` lives in a zustand store (module scope), not React state. A
 *  provider holding this in state would re-mount on some navigations and
 *  re-trigger the intro. Module scope survives every client-side route change
 *  and resets only on a true hard reload — which is exactly the semantics we
 *  want.
 */
export default function Preloader() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { introDone, masterTimeline, finishIntro, setScrollLocked } =
    useIntroStore();

  /**
   * The preloader — and ONLY the preloader — takes scrolling away.
   *
   * The store defaults to unlocked so that every page which does not have an
   * intro scrolls normally, including on a hard load. Locking here, on mount,
   * means the lock can never outlive the thing that needed it. This runs as a
   * layout effect (before paint), so the visitor cannot scroll during the
   * frame between mount and lock.
   */
  useGSAP(() => {
    if (!introDone) setScrollLocked(true);
  }, []);

  useGSAP(
    () => {
      registerGsap();

      /* Nothing to do if we have already played, or if the hero has not yet
         handed us the shared timeline. */
      if (introDone || !masterTimeline) return;

      /* Reduced motion: no theatre. Release the scroll lock and get out of the
         way immediately. */
      if (prefersReducedMotion()) {
        finishIntro();
        return;
      }

      const root = containerRef.current;
      if (!root) return;

      const cards = gsap.utils.toArray<HTMLElement>(".intro-card");
      const numberEl = root.querySelector<HTMLElement>(".intro-count");

      /* Per-character mask on the wordmark. `mask: "chars"` wraps each glyph in
         an overflow-hidden span so it can slide in from outside itself. */
      const split = SplitText.create(".intro-wordmark", {
        type: "chars",
        mask: "chars",
        aria: "auto",
      });

      /* START STATES, set imperatively rather than in CSS.
         Why: if these lived in CSS, the cards would be invisible to a visitor
         whose JS failed. Setting them in JS means the no-JS fallback is simply
         "everything is already visible", which is the correct fallback. */
      gsap.set(cards, {
        scale: 0,
        rotation: "random(-15, 15)",
        transformOrigin: "center",
      });

      const tl = gsap.timeline();

      /* ── A. CARDS IN ─────────────────────────────────────────────────── */
      tl.to(cards, {
        scale: 1,
        duration: 1.1,
        ease: "power2.out",
        stagger: { each: 0.14 },
      })

        /* ── B. WORDMARK ──────────────────────────────────────────────────
           "<" means "start at the same time as the previous tween started".
           GSAP's position parameter shorthand is worth memorising:
              "<"      align with previous tween's START
              ">"      align with previous tween's END
              "<0.3"   0.3s after previous START
              "-=0.5"  0.5s before the timeline's current END (overlap)
              1.2      absolute time on this timeline                        */
        .from(
          split.chars,
          {
            yPercent: 100,
            duration: 1,
            ease: "hop",
            /* `from: "random"` scatters the stagger order. On a six-letter
               wordmark this is the entire personality of the animation —
               sequential would read as ordinary, random reads as designed. */
            stagger: { amount: 1.1, from: "random" },
          },
          "<0.25",
        );

      /* ── C. COUNTER (parallel, position 0) ──────────────────────────────
         We tween a plain object and write the formatted value out in onUpdate.
         This is the standard GSAP count-up: you never animate textContent
         directly, you animate a number and render it. */
      const counter = { value: 0 };
      tl.to(
        counter,
        {
          value: 100,
          duration: MOTION.duration.preloaderHold,
          ease: "drift",
          onUpdate: () => {
            if (numberEl) numberEl.textContent = pad(Math.round(counter.value), 3);
          },
        },
        0,
      );

      /* ── D. EXIT ────────────────────────────────────────────────────────── */
      tl.to(cards, {
        scale: 0,
        duration: 0.7,
        ease: "power2.inOut",
        stagger: { each: 0.08, from: "end" },
      })
        .to(numberEl, { yPercent: -120, autoAlpha: 0, duration: 0.5 }, "<")
        .to(
          split.chars,
          {
            yPercent: -100,
            duration: 0.8,
            ease: "hop",
            stagger: { each: 0.05, from: "random" },
          },
          "<0.1",
        )
        /* The curtain wipe. `inset(0 0 100% 0)` collapses the visible box from
           the bottom edge upward, so the panel appears to be pulled off the
           screen rather than faded — a fade would show both layers at once and
           look muddy. */
        .to(
          root,
          {
            clipPath: "inset(0% 0% 100% 0%)",
            duration: MOTION.duration.curtain,
            ease: "glide",
            /* Release the scroll lock and unmount, on the LAST tween only. */
            onComplete: finishIntro,
          },
          "<0.35",
        );

      /* Hand the sequence to the master timeline. The hero has already
         appended itself with a negative offset, so the two overlap. */
      masterTimeline.add(tl, 0);
    },
    { scope: containerRef, dependencies: [masterTimeline, introDone] },
  );

  /* Unmount completely once done — a fixed, full-screen element left in the
     DOM at clip-path 100% still creates a compositor layer for the rest of the
     session. */
  if (introDone) return null;

  return (
    <div
      ref={containerRef}
      /* aria-hidden + no focusable children: the intro is decoration, and a
         screen-reader user should be reading the real page, not this. */
      aria-hidden
      className="fixed inset-0 z-[100] bg-[#050505] text-[#ede4dd]"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      {/* The six stacked cards. All absolutely centred on top of each other —
          the random rotation and the stagger are what turn a stack into a
          fanned deck. */}
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="intro-card gpu absolute top-1/2 left-1/2 h-[min(46vh,22rem)] w-[min(34vw,16.5rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden"
        >
          <Image
            src={`/image-0${i + 1}.avif`}
            alt=""
            width={256}
            height={341}
            /* The intro is the first thing on screen, so these must not be
               lazy-loaded. `priority` puts them in the initial paint. */
            priority
            className="h-full w-full object-cover"
          />
        </div>
      ))}

      {/* mix-blend-difference makes the wordmark invert whatever card is
          behind it. One element, infinite contrast, no per-card logic. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center mix-blend-difference">
        <div className="relative">
          <h1 className="intro-wordmark text-[clamp(4rem,16vw,13rem)] leading-[0.8] font-bold tracking-[-0.04em] whitespace-nowrap uppercase">
            {SITE.wordmark}
          </h1>
          <span className="intro-count absolute -top-[1.2em] right-0 font-mono text-2xl tabular-nums sm:text-4xl">
            000
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ── IF YOU WANT A REAL ASSET-GATED LOADER ──────────────────────────────────
 *
 * Replace the fixed `duration` on the counter with a progress value fed by
 * actual loading, and keep a floor on the duration so a fast connection does
 * not produce a 200ms flash:
 *
 *   const urls = [...];                       // images you must have
 *   let loaded = 0;
 *   const progress = { value: 0 };
 *
 *   await Promise.all(urls.map(src => new Promise<void>(res => {
 *     const i = new window.Image();
 *     i.onload = i.onerror = () => {          // NEVER forget onerror, or a
 *       loaded++;                             // single 404 hangs the site
 *       gsap.to(progress, { value: loaded / urls.length * 100, duration: .3 });
 *       res();
 *     };
 *     i.src = src;
 *   })));
 *
 * Then `tl.to(progress, { value: 100, duration: Math.max(0, MIN - elapsed) })`
 * before the exit. The important safety rules:
 *   • always handle onerror — otherwise one broken asset = permanent loader
 *   • always keep a hard timeout (say 6s) that forces the exit regardless
 *   • never gate on assets that are below the fold
 */
