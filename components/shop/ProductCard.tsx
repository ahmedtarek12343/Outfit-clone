"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { formatPrice, pad } from "@/lib/utils";
import type { Product } from "@/data/data";

/**
 * PRODUCT CARD.
 *
 * ── THE IMAGE SWAP ─────────────────────────────────────────────────────────
 * Both images are stacked; the second is revealed with a clip-path on hover.
 * Why clip-path and not opacity? A cross-fade shows both garments at once and
 * looks like a mistake for one frame. A wipe is a deliberate transition.
 *
 * ── THE ENTRANCE ───────────────────────────────────────────────────────────
 * `once: true` + a stagger derived from `index`. The card reveals itself
 * rather than being driven by a parent, which means the grid can be
 * re-ordered, filtered or paginated without any parent animation logic
 * needing to know. Each card owns its own motion — that is the pattern that
 * keeps animation code maintainable as the page grows.
 */
export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current || prefersReducedMotion()) return;

      gsap.from(ref.current, {
        yPercent: 12,
        autoAlpha: 0,
        duration: 1,
        ease: "hop",
        /* Cap the delay so the twelfth card does not wait a second and a half.
           `gsap.utils.clamp` is handy for exactly this. */
        delay: gsap.utils.clamp(0, 0.4, index * 0.08),
        scrollTrigger: { trigger: ref.current, start: "top 88%", once: true },
      });
    },
    { scope: ref, dependencies: [index] },
  );

  const [primary, secondary] = product.images;

  return (
    <div ref={ref}>
      <Link href={`/product/${product.slug}`} className="group block">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-fg/5">
          <Image
            src={primary}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-[900ms] ease-[var(--ease-glide)] group-hover:scale-[1.04]"
          />

          {secondary && (
            <Image
              src={secondary}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              /* inset(0 0 0 100%) = fully clipped from the right. On hover it
                 opens to inset(0), wiping left-to-right. */
              className="object-cover transition-[clip-path] duration-[700ms] ease-[var(--ease-hop)] [clip-path:inset(0_0_0_100%)] group-hover:[clip-path:inset(0_0_0_0)]"
            />
          )}

          {product.badge && (
            <span className="absolute top-3 left-3 rounded-full bg-fg px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-bg">
              {product.badge}
            </span>
          )}

          {product.soldOut && (
            <span className="absolute inset-0 flex items-center justify-center bg-bg/70 font-mono text-xs uppercase tracking-[0.2em]">
              Sold out
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h3 className="flex items-baseline gap-2 text-base font-semibold">
              <span className="font-mono text-[0.65rem] opacity-40">
                {pad(product.id)}
              </span>
              {product.name}
            </h3>
            <p className="mt-0.5 text-sm opacity-55">{product.category}</p>
          </div>
          <p className="font-mono text-sm tabular-nums">
            {formatPrice(product.price, product.currency)}
          </p>
        </div>
      </Link>
    </div>
  );
}
