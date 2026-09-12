"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * ============================================================================
 *  SCROLL REVEAL — the generic "animate when it enters" wrapper
 * ============================================================================
 *
 *  UNDERSTANDING start / end, ONCE AND FOR ALL
 *
 *  Every ScrollTrigger has a start and an end, each written as two values:
 *
 *      start: "top 85%"
 *              │    └── position in the VIEWPORT  (0% = top of screen)
 *              └─────── position on the TRIGGER ELEMENT
 *
 *  So "top 85%" means: *this trigger starts when the top of the element
 *  reaches the point 85% of the way down the viewport.*
 *
 *  Common values:
 *      "top bottom"   element's top hits viewport bottom  → the instant it appears
 *      "top 85%"      just inside the fold                → best for reveals
 *      "center center" element centred in viewport         → best for pinning
 *      "bottom top"   element has fully scrolled past      → best for exits
 *
 *  You can add offsets: "top 85%+=100" or use px: "top bottom-=200".
 *
 *  `markers: true` draws all four lines on screen. Use it constantly while
 *  building; it turns scroll animation from guesswork into reading a ruler.
 *
 *  ONCE vs TOGGLE ACTIONS
 *
 *  `once: true` plays the reveal a single time and then destroys the trigger —
 *  cheapest, and correct for content reveals (an element re-hiding itself when
 *  you scroll back up is disorienting and makes a page feel unstable).
 *
 *  `toggleActions: "play reverse play reverse"` is the four-slot alternative:
 *      onEnter  onLeave  onEnterBack  onLeaveBack
 *  Use it for decorative things (a sticky label, a colour change).
 */

type RevealMode = "up" | "fade" | "clip" | "scale";

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  mode?: RevealMode;
  delay?: number;
  duration?: number;
  /** Animate direct children in sequence instead of the wrapper as a whole. */
  stagger?: number;
  /** Viewport position that fires the reveal. */
  start?: string;
  /** Show ScrollTrigger's debug markers. */
  debug?: boolean;
}

/** Per-mode `from` states. All of them animate to the element's natural state. */
const FROM_STATE: Record<RevealMode, gsap.TweenVars> = {
  up: { y: 60, autoAlpha: 0 },
  fade: { autoAlpha: 0 },
  /* clip-path is the "expensive" looking one: the element is revealed by
     growing its own visible rectangle, so nothing moves — it just exists
     more. Costs nothing on the GPU and reads as very high production value. */
  clip: { clipPath: "inset(0% 0% 100% 0%)" },
  scale: { scale: 1.12, autoAlpha: 0 },
};

export default function ScrollReveal({
  children,
  className,
  mode = "up",
  delay = 0,
  duration = 0.9,
  stagger,
  start = "top 85%",
  debug = false,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;

      /* When staggering we animate the wrapper's children; otherwise the
         wrapper itself. `gsap.utils.toArray` normalises both to an array. */
      const targets =
        stagger != null ? gsap.utils.toArray<HTMLElement>(el.children) : el;

      if (prefersReducedMotion()) {
        gsap.set(targets, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          clipPath: "inset(0% 0% 0% 0%)",
        });
        return;
      }

      /* `autoAlpha` animates opacity AND flips visibility:hidden at 0. That
         matters: a fully transparent element still swallows clicks and is
         still read by screen readers. `autoAlpha` fixes both for free. */
      gsap.from(targets, {
        ...FROM_STATE[mode],
        duration,
        delay,
        ease: "hop",
        stagger: stagger ?? 0,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          markers: debug,
        },
      });
    },
    { scope: ref, dependencies: [mode, stagger] },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
