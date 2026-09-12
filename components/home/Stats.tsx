"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { STATS } from "@/data/data";

/**
 * COUNT-UP STATS.
 *
 * THE PATTERN: never animate `textContent` as a string. Tween a NUMBER on a
 * plain object and render it in `onUpdate`. GSAP has no idea what "042" means,
 * but it knows exactly how to interpolate 0 → 42.
 *
 * `snap: { value: 1 }` forces integer steps so you never see "41.7382".
 *
 * The `tabular-nums` class is not decoration: proportional digits have
 * different widths, so a counter running 1→100 visibly jitters as it reflows.
 * Tabular figures are fixed-width and the number sits still.
 */
export default function Stats() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el) return;

      const nodes = gsap.utils.toArray<HTMLElement>("[data-count]", el);

      nodes.forEach((node) => {
        const target = Number(node.dataset.count);
        const suffix = node.dataset.suffix ?? "";

        if (prefersReducedMotion()) {
          node.textContent = `${target}${suffix}`;
          return;
        }

        const proxy = { value: 0 };
        gsap.to(proxy, {
          value: target,
          duration: 1.8,
          ease: "drift",
          snap: { value: 1 },
          onUpdate: () => {
            node.textContent = `${proxy.value}${suffix}`;
          },
          scrollTrigger: { trigger: node, start: "top 88%", once: true },
        });
      });
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      className="edge grid grid-cols-2 gap-8 border-y border-fg/15 py-16 md:grid-cols-4"
    >
      {STATS.map((stat) => (
        <div key={stat.label}>
          <p
            data-count={stat.count}
            data-suffix={stat.suffix ?? ""}
            className="text-[clamp(2.5rem,6vw,5rem)] leading-none font-bold tabular-nums tracking-[-0.04em]"
          >
            0{stat.suffix ?? ""}
          </p>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.1em] opacity-55">
            {stat.label}
          </p>
        </div>
      ))}
    </section>
  );
}
