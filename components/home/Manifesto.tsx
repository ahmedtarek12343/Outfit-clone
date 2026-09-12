"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  SplitText,
  registerGsap,
  prefersReducedMotion,
} from "@/lib/gsap";
import { MANIFESTO_LINES } from "@/data/data";

/**
 * ============================================================================
 *  PINNED WORD-BY-WORD REVEAL
 * ============================================================================
 *
 *  This is the effect that reads as "expensive" more than any other: a block
 *  of text sits centred and locked while the page scroll fills the words in
 *  one by one.
 *
 *  ── HOW PINNING WORKS ──────────────────────────────────────────────────────
 *
 *  `pin: true` does NOT use `position: sticky`. ScrollTrigger:
 *    1. measures the element,
 *    2. wraps it in a `pin-spacer` div of the same size,
 *    3. switches the element to `position: fixed`,
 *    4. grows the spacer by the pin duration so the document is still long
 *       enough to scroll.
 *
 *  Consequences you must design around:
 *
 *   • `end: "+=150%"` means "pin for 150% of the VIEWPORT height of scrolling".
 *     That number is the length of the section: it is how much scroll the
 *     visitor spends here. 100% is brisk, 300% starts to feel like a hostage
 *     situation. Tune it to the word count.
 *
 *   • A parent with `overflow: hidden` BREAKS pinning (a fixed child cannot
 *     escape it) and a parent with a `transform` breaks it too (the transform
 *     creates a containing block, so `fixed` becomes relative to it). This is
 *     the #1 reason "pin doesn't work" — it is nearly always an ancestor, not
 *     the trigger. Note how TransitionProvider clears its inline transform
 *     when the enter animation ends, precisely so pinning still works after a
 *     client-side navigation.
 *
 *   • `anticipatePin: 1` tells ScrollTrigger to apply the pin one frame early.
 *     With smooth scrolling, without it you get a visible one-frame jump at
 *     high scroll speeds.
 *
 *  ── WHY `scrub` AND NOT A TIMED ANIMATION ──────────────────────────────────
 *
 *  `scrub: true` binds animation progress to scroll progress. The visitor is
 *  driving. They can stop halfway, reverse, or scrub back and forth — the text
 *  fills and empties under their control. That agency is the point; a timed
 *  animation triggered on entry is a video, not an interaction.
 *
 *  Words are staggered with `stagger` INSIDE a scrubbed tween, which spreads
 *  them across the scrub duration, so each word gets its own slice of scroll.
 */
export default function Manifesto() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;

      if (prefersReducedMotion()) {
        gsap.set(".manifesto-line", { autoAlpha: 1 });
        return;
      }

      /* Split every line into words. We keep one SplitText per line element so
         line breaks stay exactly where the copy author put them. */
      const split = SplitText.create(".manifesto-line", {
        type: "words",
        aria: "auto",
      });

      gsap.fromTo(
        split.words,
        { opacity: 0.12 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: {
            trigger: el,
            /* Pin from the moment the section is centred... */
            start: "center center",
            /* ...for 150% of a viewport's worth of scrolling. */
            end: "+=150%",
            pin: true,
            scrub: true,
            anticipatePin: 1,
            /* Re-measure on resize. Without this, rotating a phone leaves the
               pin spacer at the old height and the section overlaps the next. */
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    /* NOTE: no `overflow-hidden` anywhere up this tree, or the pin dies. */
    <section
      ref={ref}
      className="edge flex min-h-screen items-center justify-center py-24"
    >
      <h2 className="max-w-[18ch] text-[clamp(2rem,7vw,5.5rem)] leading-[1.02] font-bold tracking-[-0.035em]">
        {MANIFESTO_LINES.map((line) => (
          <span key={line} className="manifesto-line block">
            {line}
          </span>
        ))}
      </h2>
    </section>
  );
}
