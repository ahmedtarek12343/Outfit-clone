"use client";

import { useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, Flip, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { PRODUCTS } from "@/data/data";
import ProductCard from "@/components/shop/ProductCard";
import AnimatedText from "@/components/ui/AnimatedText";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  SHOP — filtering with GSAP Flip
 * ============================================================================
 *
 *  THE PROBLEM
 *  Filter a grid and React re-renders it instantly: items teleport to new
 *  positions. There is nothing to animate, because by the time you could
 *  animate it the DOM is already in its final state.
 *
 *  THE FLIP TECHNIQUE (First, Last, Invert, Play)
 *    1. FIRST   record every item's position BEFORE the change
 *    2. LAST    let React do the re-render
 *    3. INVERT  apply transforms that put each item visually back where it was
 *    4. PLAY    animate those transforms to zero
 *
 *  The result: elements appear to glide from their old slots to their new ones,
 *  even though the browser moved them instantly. `Flip.getState()` /
 *  `Flip.from()` is GSAP's implementation of this.
 *
 *  The critical detail is ORDER: `Flip.getState()` must run BEFORE the state
 *  update commits, and `Flip.from()` must run AFTER. `useGSAP` with the filter
 *  in `dependencies` runs as a layout effect — after the DOM mutation but
 *  before the browser paints — which is exactly the window we need. Using
 *  `useEffect` here would paint the un-inverted frame first and you would see
 *  a flicker.
 */

const CATEGORIES = ["All", "Tee", "Knitwear", "Accessories"] as const;
type Category = (typeof CATEGORIES)[number];

/** Map the human filter onto the product's `category` string. */
function matches(category: Category, productCategory: string) {
  if (category === "All") return true;
  const c = productCategory.toLowerCase();
  if (category === "Tee") return c.includes("tee") || c.includes("longsleeve");
  if (category === "Knitwear")
    return c.includes("crewneck") || c.includes("hoodie") || c.includes("sweatpant");
  return c.includes("cap") || c.includes("tote") || c.includes("jacket");
}

export default function ShopPage() {
  const [filter, setFilter] = useState<Category>("All");
  const gridRef = useRef<HTMLDivElement>(null);
  /* Holds the FIRST snapshot between the click and the re-render.
     `ReturnType<typeof Flip.getState>` rather than `Flip.FlipState`: the
     latter is a global ambient namespace, and our local `import { Flip }`
     shadows it, so the namespace form does not resolve. Deriving the type
     from the function is immune to that. */
  const stateRef = useRef<ReturnType<typeof Flip.getState> | null>(null);

  const visible = useMemo(
    () => PRODUCTS.filter((p) => matches(filter, p.category)),
    [filter],
  );

  const onFilter = (next: Category) => {
    if (next === filter) return;
    registerGsap();
    /* (1) FIRST — snapshot before React changes anything. */
    if (gridRef.current && !prefersReducedMotion()) {
      stateRef.current = Flip.getState(gridRef.current.children);
    }
    setFilter(next);
  };

  useGSAP(
    () => {
      const state = stateRef.current;
      if (!state) return;
      stateRef.current = null;

      /* (3)(4) INVERT + PLAY. `absolute: true` takes the moving items out of
         the layout flow for the duration, so the ones that stay put do not
         get shoved around mid-flight. */
      Flip.from(state, {
        duration: 0.6,
        ease: "hop",
        absolute: true,
        stagger: 0.03,
        /* Items that did not exist before fade+scale in; items that are gone
           fade out. Flip handles both with these two callbacks. */
        onEnter: (els) =>
          gsap.fromTo(
            els,
            { autoAlpha: 0, scale: 0.92 },
            { autoAlpha: 1, scale: 1, duration: 0.5 },
          ),
        onLeave: (els) => gsap.to(els, { autoAlpha: 0, scale: 0.92, duration: 0.4 }),
        /* Grid geometry changed, so any trigger measured against it is stale. */
        onComplete: () => ScrollTrigger.refresh(),
      });
    },
    { dependencies: [filter] },
  );

  return (
    <div className="edge pt-[18vh] pb-24">
      <header className="border-b border-fg/15 pb-6">
        <AnimatedText
          as="h1"
          split="chars"
          trigger="mount"
          staggerAmount={0.5}
          from="random"
          className="text-[clamp(3rem,13vw,11rem)] leading-[0.82] font-bold tracking-[-0.045em] uppercase"
        >
          Shop
        </AnimatedText>
      </header>

      {/* Filter bar. `aria-pressed` is what tells a screen reader which filter
          is active — colour alone does not. */}
      <div className="flex flex-wrap items-center gap-2 py-8">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={filter === c}
            onClick={() => onFilter(c)}
            className={cn(
              "rounded-full border px-5 py-2 font-mono text-xs uppercase tracking-[0.1em] transition-colors duration-400",
              filter === c
                ? "border-fg bg-fg text-bg"
                : "border-fg/25 hover:border-fg",
            )}
          >
            {c}
          </button>
        ))}
        <p className="ml-auto font-mono text-xs uppercase tracking-[0.1em] opacity-50">
          {visible.length} {visible.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      <div
        ref={gridRef}
        className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
      >
        {visible.map((product, i) => (
          /* `data-flip-id` is how Flip matches an element across renders. The
             React `key` is not enough — Flip works on DOM nodes, not the React
             tree, so it needs its own stable identity attribute. */
          <div key={product.slug} data-flip-id={product.slug}>
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>
    </div>
  );
}
