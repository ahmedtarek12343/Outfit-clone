"use client";

import { FEATURED_PRODUCTS } from "@/data/data";
import ProductCard from "@/components/shop/ProductCard";
import AnimatedText from "@/components/ui/AnimatedText";
import MagneticButton from "@/components/ui/MagneticButton";

/**
 * FEATURED GRID.
 *
 * The layout trick: an asymmetric grid where one item spans two columns and
 * sits lower than its neighbours (`md:mt-24`). Perfectly aligned grids read as
 * a template; a deliberately broken baseline reads as art direction. The
 * offsets are hard-coded per index rather than random, because random means
 * you cannot reproduce a layout you liked.
 */
const OFFSETS = ["md:mt-0", "md:mt-24", "md:mt-12"];

export default function FeaturedGrid() {
  return (
    <section className="edge py-24 md:py-32">
      <div className="mb-14 flex flex-wrap items-end justify-between gap-6 border-b border-fg/15 pb-6">
        <AnimatedText
          as="h2"
          split="chars"
          staggerAmount={0.4}
          className="text-[clamp(2rem,6vw,4.5rem)] leading-[0.95] font-bold tracking-[-0.035em] uppercase"
        >
          The Drop
        </AnimatedText>
        <p className="max-w-[34ch] font-mono text-xs uppercase tracking-[0.1em] opacity-60">
          Three pieces from the signature run. Everything is made in short
          batches and does not come back.
        </p>
      </div>

      <div className="grid gap-x-6 gap-y-14 md:grid-cols-3">
        {FEATURED_PRODUCTS.map((product, i) => (
          <div key={product.slug} className={OFFSETS[i % OFFSETS.length]}>
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>

      <div className="mt-16 flex justify-center">
        <MagneticButton href="/shop" variant="outline">
          See all eight pieces
        </MagneticButton>
      </div>
    </section>
  );
}
