"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  PARALLAX IMAGE — scrub-linked motion done without gaps
 * ============================================================================
 *
 *  THE MISTAKE EVERYONE MAKES
 *  Parallax means moving the image slower than the page. If you move a
 *  correctly-sized image, it slides out of its own frame and you get a gap at
 *  the top or bottom.
 *
 *  THE FIX: give the inner image MORE HEIGHT than the frame (here 120%), then
 *  animate it between -10% and +10% — it never runs out of material. That is
 *  the entire technique. The wrapper is `overflow-hidden`; the image is
 *  oversized; you animate the surplus.
 *
 *  SCRUB
 *      scrub: true    animation progress === scroll progress, exactly.
 *      scrub: 1       progress *chases* scroll with ~1s of smoothing. This is
 *                     almost always what you want with a smooth-scroll library:
 *                     it adds weight and hides any single-frame jitter.
 *
 *  WHY yPercent AND NOT y or top
 *      - `top` triggers layout on every frame (slow, janky).
 *      - `y` is a transform (fast) but is in pixels, so the effect strength
 *        changes with viewport size.
 *      - `yPercent` is a transform AND relative to the element's own height,
 *        so the effect is identical on a phone and a 4K monitor.
 */

interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  /** How far the image drifts, in % of its own height. 10 is subtle, 25 is loud. */
  strength?: number;
  /** Scale the image slightly as it passes — reads as depth. */
  zoom?: boolean;
  priority?: boolean;
  sizes?: string;
}

export default function ParallaxImage({
  src,
  alt,
  className,
  strength = 12,
  zoom = false,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: ParallaxImageProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!frameRef.current || !innerRef.current) return;
      if (prefersReducedMotion()) return;

      gsap.fromTo(
        innerRef.current,
        { yPercent: -strength, scale: zoom ? 1 : 1 },
        {
          yPercent: strength,
          scale: zoom ? 1.12 : 1,
          ease: "none", // scrubbed animations must be linear — the scroll IS the easing
          scrollTrigger: {
            trigger: frameRef.current,
            /* Run the whole length of the element's pass through the viewport:
               from "it is about to enter" to "it has fully left". */
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
            invalidateOnRefresh: true,
          },
        },
      );
    },
    { scope: frameRef, dependencies: [strength, zoom] },
  );

  return (
    <div ref={frameRef} className={cn("relative overflow-hidden", className)}>
      {/* -top-[10%] h-[120%] is the surplus material that prevents gaps. */}
      <div ref={innerRef} className="absolute -top-[10%] left-0 h-[120%] w-full">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          sizes={sizes}
          className="object-cover"
        />
      </div>
    </div>
  );
}
