"use client";

import { LOOKBOOK } from "@/data/data";
import ParallaxImage from "@/components/ui/ParallaxImage";
import AnimatedText from "@/components/ui/AnimatedText";
import { pad } from "@/lib/utils";

/**
 * LOOKBOOK.
 *
 * Alternating parallax strengths (and one negative) mean adjacent images drift
 * at different rates and in opposite directions. Uniform parallax across a
 * page is almost invisible; DIFFERENTIAL parallax is what the eye reads as
 * depth. That is the only idea in this component.
 */
const STRENGTHS = [14, -10, 18, -12];

export default function Lookbook() {
  return (
    <section className="edge py-24 md:py-32">
      <div className="mb-14 flex items-end justify-between gap-6 border-b border-fg/15 pb-6">
        <AnimatedText
          as="h2"
          split="chars"
          staggerAmount={0.4}
          className="text-[clamp(2rem,6vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.035em] uppercase"
        >
          Lookbook
        </AnimatedText>
        <p className="font-mono text-xs uppercase tracking-[0.1em] opacity-60">
          FW/26
        </p>
      </div>

      <div className="grid gap-x-6 gap-y-16 md:grid-cols-2">
        {LOOKBOOK.map((look, i) => (
          <figure
            key={look.caption}
            /* Nudging every second figure down the page keeps the two columns
               from scrolling as a single block. */
            className={i % 2 === 1 ? "md:mt-28" : undefined}
          >
            <ParallaxImage
              src={look.image}
              alt={look.caption}
              strength={STRENGTHS[i % STRENGTHS.length]}
              zoom={i % 2 === 0}
              className="aspect-[4/5] w-full"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <figcaption className="mt-3 flex items-baseline gap-3 font-mono text-xs uppercase tracking-[0.1em] opacity-60">
              <span>{pad(i + 1)}</span>
              {look.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
