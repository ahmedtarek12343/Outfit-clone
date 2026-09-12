"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  MARQUEE — seamless loop in CSS, reactive skew in JS
 * ============================================================================
 *
 *  THE SEAMLESS LOOP
 *  Render the item list TWICE inside one flex track, then translate the track
 *  by exactly -50%. At the moment the animation restarts, copy #2 is sitting
 *  precisely where copy #1 started, so the jump is invisible. Any other
 *  percentage produces a visible stutter — this is why it must be two copies
 *  and -50%, not three copies and -33%.
 *
 *  WHY CSS AND NOT GSAP
 *  An infinite decorative loop should not consume a JS tick. CSS animations
 *  run on the compositor, keep going while the main thread is busy parsing or
 *  hydrating, and the browser pauses them when they scroll off-screen.
 *
 *  THE PART THAT NEEDS JS: VELOCITY SKEW
 *  `ScrollTrigger.getVelocity()` returns scroll speed in px/sec. Mapping that
 *  to `skewX` makes the strip appear to be dragged by the scroll — the detail
 *  that makes a ticker feel connected to the page rather than decorative.
 *
 *  ⚠ THE TRAP THAT COSTS AN HOUR
 *  A running CSS animation on `transform` BEATS an inline `transform` set by
 *  JS (animations sit above inline styles in the cascade). So you cannot skew
 *  the same element that carries `animation: marquee-x`. The two must be
 *  separate nodes:
 *
 *      .overflow-hidden            ← clips
 *        └ [data-marquee-skew]     ← GSAP owns transform here  (skewX)
 *            ├ [track] animate-marquee   ← CSS owns transform here (translate)
 *            └ [track] animate-marquee   ← duplicate for the seam
 *
 *  Two elements, two owners of `transform`, no conflict.
 */

interface MarqueeProps {
  items: string[];
  className?: string;
  /** Seconds for one full pass. Bigger = slower. */
  duration?: number;
  reverse?: boolean;
  separator?: string;
  /** React to scroll velocity with a skew. */
  velocitySkew?: boolean;
}

export default function Marquee({
  items,
  className,
  duration = 28,
  reverse = false,
  separator = "✳",
  velocitySkew = true,
}: MarqueeProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el || !velocitySkew || prefersReducedMotion()) return;

      const skewEl = el.querySelector<HTMLElement>("[data-marquee-skew]");
      if (!skewEl) return;

      /* ONE proxy object, created once. The decay tween below animates this
         object's `v` and writes it out in onUpdate. Because every decay tween
         shares this single target, `overwrite: true` genuinely replaces the
         previous one instead of stacking — which is the whole point. (Passing
         a fresh `{v: ...}` literal each time, a very easy mistake, would make
         overwrite a no-op and leave dozens of tweens fighting.) */
      const proxy = { v: 0 };
      const applySkew = () => gsap.set(skewEl, { skewX: proxy.v });

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        onUpdate: (self) => {
          /* Clamp to ±10°: a trackpad flick can report thousands of px/sec,
             which would smear the text into something unreadable. */
          const target = gsap.utils.clamp(-10, 10, self.getVelocity() / -240);

          gsap.to(proxy, {
            v: target,
            duration: 0.25,
            ease: "power2.out",
            overwrite: true,
            onUpdate: applySkew,
            /* Settle back to flat, otherwise the strip stays skewed after the
               scroll stops. */
            onComplete: () => {
              gsap.to(proxy, {
                v: 0,
                duration: 0.6,
                ease: "power3.out",
                overwrite: true,
                onUpdate: applySkew,
              });
            },
          });
        },
      });

      return () => {
        st.kill();
        gsap.killTweensOf(proxy);
      };
    },
    { scope: ref, dependencies: [velocitySkew] },
  );

  /* The doubled list. `aria-hidden` on the second copy stops screen readers
     announcing every item twice. */
  const row = (hidden: boolean) => (
    <div
      aria-hidden={hidden}
      className={cn(
        "flex shrink-0 items-center gap-8 pr-8 whitespace-nowrap",
        reverse ? "animate-marquee-reverse" : "animate-marquee",
      )}
      style={{ "--marquee-duration": `${duration}s` } as React.CSSProperties}
    >
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="flex items-center gap-8">
          <span>{item}</span>
          <span aria-hidden className="opacity-40">
            {separator}
          </span>
        </span>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      className={cn("marquee-group relative overflow-hidden", className)}
    >
      <div data-marquee-skew className="flex will-change-transform">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
