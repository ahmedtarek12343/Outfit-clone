"use client";

import { useRef } from "react";
import { TransitionRouter } from "next-transition-router";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { resetScroll } from "@/lib/lenis";

/**
 * ============================================================================
 *  PAGE TRANSITIONS
 * ============================================================================
 *
 *  THE CORE PROBLEM
 *  In the App Router, clicking a <Link> swaps the page as soon as the RSC
 *  payload arrives. There is no built-in "wait, let me animate the old page
 *  out first". So a transition library has to sit between the click and the
 *  navigation:
 *
 *      click → [ leave animation ] → next() → React swaps → [ enter animation ]
 *
 *  `next-transition-router` gives you exactly those two hooks. `auto` patches
 *  every next/link on the page so you do not have to swap your imports.
 *
 *  ── THE CURTAIN, AND WHY scaleY WITH A MOVING ORIGIN ───────────────────────
 *
 *  The overlay is a single full-screen div scaled on Y:
 *
 *    LEAVE   transformOrigin: bottom, scaleY 0 → 1   (rises from the bottom)
 *    ENTER   transformOrigin: top,    scaleY 1 → 0   (retracts out the top)
 *
 *  Moving the origin between the two halves is what makes it read as ONE
 *  continuous sheet travelling up the screen, rather than a panel that grows
 *  and then shrinks back the way it came. It is one property change and it is
 *  the entire illusion.
 *
 *  We scale rather than animate `height` because scale is a compositor
 *  operation — no layout, no paint, 60fps even mid-navigation when the main
 *  thread is busy parsing the incoming RSC payload. Animating `height` here
 *  would jank precisely when you can least afford it.
 *
 *  ── THE TWO THINGS EVERYONE FORGETS ────────────────────────────────────────
 *
 *  1. SCROLL POSITION. The new page mounts at whatever scroll offset the old
 *     one was at. You must reset to 0 — and you must do it WHILE THE CURTAIN
 *     IS CLOSED, in the gap between leave and enter, or the visitor watches
 *     the page jump. Because Lenis owns scrolling, `window.scrollTo` is not
 *     enough; we reset both (see `resetScroll`).
 *
 *  2. SCROLLTRIGGER STATE. Every trigger on the outgoing page cached a
 *     start/end pixel value for a document that no longer exists. useGSAP's
 *     context kills the triggers it created, but the new page's triggers are
 *     built against a layout that may still be settling. `ScrollTrigger.refresh()`
 *     after the enter animation forces a clean re-measure. Skip this and you
 *     get the classic symptom: animations that work on reload but not after
 *     an in-app navigation.
 */
export default function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const curtainRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  return (
    <>
      {/*
        The curtain lives OUTSIDE the animated page wrapper, so the page's own
        scale transform does not also scale the curtain.
        `pointer-events-none` means it never swallows a click, even mid-flight.
      */}
      <div
        ref={curtainRef}
        aria-hidden
        className="pointer-events-none fixed inset-0 z-50 bg-fg will-change-transform"
        style={{ transform: "scaleY(0)", transformOrigin: "bottom" }}
      />

      <TransitionRouter
        auto
        leave={(next) => {
          registerGsap();
          const curtain = curtainRef.current;
          const page = pageRef.current;

          /* Reduced motion: navigate immediately, no theatre. */
          if (!curtain || !page || prefersReducedMotion()) {
            resetScroll();
            next();
            return;
          }

          const tl = gsap.timeline({
            onComplete: () => {
              /* Curtain is fully closed here — safe to jump the scroll. */
              resetScroll();
              next();
            },
          });

          gsap.set(curtain, { transformOrigin: "bottom" });

          tl.to(page, {
            /* The outgoing page shrinks slightly and dims. This "push back"
               is what gives the transition depth: the old page recedes, the
               curtain passes in front of it. */
            scale: 0.94,
            opacity: 0.5,
            duration: 0.6,
            ease: "glide",
          }).to(
            curtain,
            { scaleY: 1, duration: 0.6, ease: "glide" },
            "<",
          );

          /* The returned function is the library's abort handler: it runs if
             the visitor clicks another link mid-transition. Killing the
             timeline stops the two from fighting over the same properties. */
          return () => tl.kill();
        }}
        enter={(next) => {
          const curtain = curtainRef.current;
          const page = pageRef.current;

          if (!curtain || !page || prefersReducedMotion()) {
            gsap.set([curtain, page].filter(Boolean), {
              clearProps: "all",
            });
            ScrollTrigger.refresh();
            next();
            return;
          }

          /* Flip the origin to the TOP so the sheet continues upward instead
             of retreating back down. */
          gsap.set(curtain, { transformOrigin: "top" });
          gsap.set(page, { scale: 1.04, opacity: 0 });

          const tl = gsap.timeline({
            onComplete: () => {
              /* Clear the inline transforms GSAP left behind. Leaving a
                 `transform` on the page wrapper creates a containing block,
                 which silently breaks `position: fixed` children and
                 ScrollTrigger's pinning inside the new page. */
              gsap.set(page, { clearProps: "transform,opacity" });
              /* Re-measure everything against the new layout. */
              ScrollTrigger.refresh();
              next();
            },
          });

          tl.to(curtain, { scaleY: 0, duration: 0.65, ease: "glide" }).to(
            page,
            { scale: 1, opacity: 1, duration: 0.65, ease: "glide" },
            "<",
          );

          return () => tl.kill();
        }}
      >
        <div ref={pageRef} className="min-h-screen origin-center">
          {children}
        </div>
      </TransitionRouter>
    </>
  );
}
