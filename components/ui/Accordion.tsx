"use client";

import { useRef, useState } from "react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { useGSAP } from "@gsap/react";
import type { FaqItem } from "@/data/data";
import { pad } from "@/lib/utils";

/**
 * ACCORDION — and the `height: auto` problem.
 *
 * You cannot CSS-transition to `height: auto`; the browser has no idea what
 * the end value is. The three ways round it:
 *
 *   1. max-height with a guessed large value  — janky easing, content clipping
 *   2. grid-template-rows: 0fr → 1fr         — pure CSS, works, but no easing
 *                                               control and quirky in Safari
 *   3. animate to the measured height, then   — what we do here
 *      set it back to auto on complete
 *
 * GSAP makes (3) a one-liner because it accepts `height: "auto"` and measures
 * the target for you. The important part is CLEARING the inline height when
 * the animation finishes — otherwise the panel is locked at whatever height
 * it had when it opened, and stops responding to viewport changes.
 */
export default function Accordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const listRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const panels = gsap.utils.toArray<HTMLElement>("[data-panel]");

      panels.forEach((panel, i) => {
        const isOpen = i === openIndex;

        if (prefersReducedMotion()) {
          gsap.set(panel, { height: isOpen ? "auto" : 0, autoAlpha: isOpen ? 1 : 0 });
          return;
        }

        gsap.to(panel, {
          height: isOpen ? "auto" : 0,
          autoAlpha: isOpen ? 1 : 0,
          duration: 0.55,
          ease: "glide",
          /* Release the measured height so the panel can reflow afterwards. */
          onComplete: () => {
            if (isOpen) gsap.set(panel, { height: "auto" });
          },
        });
      });
    },
    { scope: listRef, dependencies: [openIndex] },
  );

  return (
    <div ref={listRef} className="border-t border-fg/15">
      {items.map((item, i) => {
        const isOpen = i === openIndex;
        return (
          <div key={item.q} className="border-b border-fg/15">
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`faq-panel-${i}`}
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-left"
              >
                <span className="flex items-baseline gap-4">
                  <span className="font-mono text-xs opacity-40">
                    {pad(i + 1)}
                  </span>
                  <span className="text-xl font-semibold md:text-2xl">
                    {item.q}
                  </span>
                </span>
                {/* A plus that rotates into a minus — one span, one transform. */}
                <span
                  aria-hidden
                  className="relative h-4 w-4 shrink-0"
                >
                  <span className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current" />
                  <span
                    className="absolute top-1/2 left-0 h-px w-4 -translate-y-1/2 bg-current transition-transform duration-500 ease-[var(--ease-hop)]"
                    style={{ transform: `translateY(-50%) rotate(${isOpen ? 0 : 90}deg)` }}
                  />
                </span>
              </button>
            </h3>
            {/* height starts at 0 for all but the first; overflow-hidden is
                what makes the height animation read as a reveal. */}
            <div
              id={`faq-panel-${i}`}
              data-panel
              className="overflow-hidden"
              style={i === 0 ? undefined : { height: 0, opacity: 0 }}
            >
              <p className="max-w-2xl pb-6 pl-10 text-base leading-relaxed opacity-75">
                {item.a}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
