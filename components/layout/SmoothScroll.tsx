"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger, registerGsap } from "@/lib/gsap";
import { setLenis } from "@/lib/lenis";
import { useIntroStore } from "@/store/intro.store";
import { MOTION } from "@/data/data";

/**
 * ============================================================================
 *  SMOOTH SCROLL — and how to wire it to ScrollTrigger correctly
 * ============================================================================
 *
 *  Lenis does not scroll the document the way the browser does. It intercepts
 *  wheel/touch events, keeps its own animated scroll value, and applies it as
 *  a transform. That means:
 *
 *    ✗ the native `scroll` event no longer reflects the visual position
 *    ✗ ScrollTrigger, which listens for that event, ends up a frame behind —
 *      pinned sections jitter and scrubbed animations lag behind the content
 *
 *  The fix is three lines, and they must ALL be present:
 *
 *    1. lenis.on("scroll", ScrollTrigger.update)
 *         Push Lenis's value into ScrollTrigger the instant it changes.
 *    2. gsap.ticker.add((t) => lenis.raf(t * 1000))
 *         Drive Lenis from GSAP's ticker instead of its own requestAnimationFrame.
 *         Now there is ONE rAF loop for the whole site, so Lenis and GSAP
 *         always agree on what "this frame" means. (This is also why we pass
 *         `autoRaf: false` below — otherwise Lenis runs a second loop.)
 *         GSAP's ticker is in seconds, Lenis wants milliseconds: hence × 1000.
 *    3. gsap.ticker.lagSmoothing(0)
 *         GSAP normally "protects" you after a long frame by pretending less
 *         time passed. For a scroll-linked animation that protection is
 *         exactly wrong — it desynchronises scroll position from animation
 *         progress. Turning it off keeps them locked.
 *
 *  The order matters too: register plugins BEFORE creating Lenis, or the
 *  ScrollTrigger.update reference does not exist yet.
 */
export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);
  const scrollLocked = useIntroStore((s) => s.scrollLocked);

  useEffect(() => {
    registerGsap();

    const lenis = new Lenis({
      /* `duration` + `easing` is the "glide" model: every wheel tick starts a
         fixed-length eased animation. `lerp` is the alternative (exponential
         approach to target). duration/easing gives a more designed, less
         floaty feel, which is what this kind of site wants. */
      duration: MOTION.lenis.duration,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: MOTION.lenis.wheelMultiplier,
      touchMultiplier: MOTION.lenis.touchMultiplier,
      /* Leave real touch scrolling to the OS. Hijacking it costs you momentum
         physics that no JS implementation matches, and it is the single
         biggest cause of "this site feels broken on my phone". */
      syncTouch: false,
      /* We drive the loop from GSAP's ticker (see below), so Lenis must not
         run its own. */
      autoRaf: false,
      /* Let Lenis handle in-page #anchor links so they glide too. */
      anchors: true,
    });

    lenisRef.current = lenis;
    /* Publish the instance so imperative callers (page transitions, modals)
       can stop/start/reset scrolling without a context. */
    setLenis(lenis);

    // (1) Keep ScrollTrigger in lockstep with Lenis.
    lenis.on("scroll", ScrollTrigger.update);

    // (2) One rAF loop for everything.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    // (3) Never fake elapsed time on a scroll-linked site.
    gsap.ticker.lagSmoothing(0);

    /* ScrollTrigger measures the document once and caches it. Images decoding
       or fonts swapping in afterwards change the page height, and every
       trigger's start/end is then wrong. Refreshing after `load` catches that
       cheaply. */
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
      setLenis(null);
    };
  }, []);

  /* The preloader needs the page frozen while it plays. Calling
     lenis.stop()/start() is better than `overflow: hidden` on body, because
     toggling overflow changes the scrollbar's presence and reflows the whole
     layout — which on a pinned-section page means ScrollTrigger recalculates
     mid-intro. */
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (scrollLocked) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [scrollLocked]);

  return <>{children}</>;
}
