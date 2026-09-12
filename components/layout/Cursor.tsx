"use client";

import { useEffect, useRef } from "react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";

/**
 * ============================================================================
 *  CUSTOM CURSOR
 * ============================================================================
 *
 *  Rules for not making this annoying:
 *
 *   1. POINTER DEVICES ONLY. `(hover: hover) and (pointer: fine)`. A custom
 *      cursor on a touch device is an invisible element that follows taps
 *      around for no reason.
 *   2. NEVER hide the native cursor until the custom one is confirmed on
 *      screen. We set `body[data-cursor="on"]` only after the first real
 *      mousemove — so a keyboard-only or touch visitor never loses their
 *      pointer.
 *   3. `quickTo`, not `gsap.to` (see MagneticButton for why).
 *   4. Two different follow speeds. The dot is near-instant (0.15s) and the
 *      ring lags (0.55s). That difference is the effect; matched speeds just
 *      look like a big cursor.
 *
 *  THE HOVER STATE
 *  Rather than registering listeners on every interactive element (which
 *  breaks as soon as content changes), we use ONE delegated listener and
 *  `event.target.closest("a, button, [data-cursor-hover]")`. Works for
 *  elements added later, costs one listener.
 */
export default function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    registerGsap();

    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || prefersReducedMotion()) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    /* ⚠ Centre the layers with GSAP's xPercent/yPercent, NOT with Tailwind's
       `-translate-x-1/2`. GSAP owns the `transform` property on these nodes:
       the moment it writes `x`, any transform that came from a class is gone.
       xPercent/yPercent are part of the same transform GSAP composes, so they
       survive every subsequent x/y write. Same rule as the marquee — exactly
       one owner of `transform` per element. */
    gsap.set([dot, ring], { xPercent: -50, yPercent: -50 });

    /* Reusable setters — created once, called thousands of times. */
    const dotX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3" });
    const dotY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3" });
    const ringX = gsap.quickTo(ring, "x", { duration: 0.55, ease: "power3" });
    const ringY = gsap.quickTo(ring, "y", { duration: 0.55, ease: "power3" });

    let shown = false;

    const onMove = (e: MouseEvent) => {
      if (!shown) {
        shown = true;
        document.body.dataset.cursor = "on";
        gsap.to([dot, ring], { autoAlpha: 1, duration: 0.3 });
      }
      dotX(e.clientX);
      dotY(e.clientY);
      ringX(e.clientX);
      ringY(e.clientY);
    };

    /* One delegated listener for all hover targets, now and in the future. */
    const onOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest(
        "a, button, [data-cursor-hover]",
      );
      gsap.to(ring, {
        scale: target ? 2.4 : 1,
        opacity: target ? 0.5 : 1,
        duration: 0.4,
        ease: "hop",
      });
    };

    /* Hide when the pointer leaves the window entirely, otherwise the cursor
       sticks to the last known position at the edge of the screen. */
    const onLeaveWindow = () => gsap.to([dot, ring], { autoAlpha: 0, duration: 0.2 });
    const onEnterWindow = () => gsap.to([dot, ring], { autoAlpha: 1, duration: 0.2 });

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    document.addEventListener("mouseleave", onLeaveWindow);
    document.addEventListener("mouseenter", onEnterWindow);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseleave", onLeaveWindow);
      document.removeEventListener("mouseenter", onEnterWindow);
      delete document.body.dataset.cursor;
    };
  }, []);

  return (
    <>
      {/* Both layers are fixed at 0,0 and MOVED ONLY BY TRANSFORMS.
          Animating left/top instead would trigger layout on every mouse move —
          the single most common cause of a laggy custom cursor. Centring is
          done in JS (xPercent/yPercent) for the reason explained above. */}
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[200] h-1.5 w-1.5 rounded-full bg-fg opacity-0 mix-blend-difference max-md:hidden"
      />
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed top-0 left-0 z-[200] h-8 w-8 rounded-full border border-fg opacity-0 mix-blend-difference max-md:hidden"
      />
    </>
  );
}
