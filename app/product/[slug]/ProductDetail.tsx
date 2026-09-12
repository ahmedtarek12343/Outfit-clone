"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { PRODUCTS, type Product } from "@/data/data";
import { useCartStore } from "@/store/cart.store";
import { formatPrice, pad, cn } from "@/lib/utils";
import MagneticButton from "@/components/ui/MagneticButton";
import AnimatedText from "@/components/ui/AnimatedText";
import ProductCard from "@/components/shop/ProductCard";

/**
 * PRODUCT DETAIL — the client island.
 *
 * The entrance animation is a staggered clip-path reveal on the gallery plus a
 * masked line reveal on the copy. Both play on MOUNT rather than on scroll,
 * because this content is above the fold: a scroll trigger set to "top 85%" on
 * an element that starts at the top of the viewport fires instantly anyway,
 * and relying on that is fragile.
 */
export default function ProductDetail({ product }: { product: Product }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<string | null>(
    product.sizes.length === 1 ? product.sizes[0] : null,
  );
  const [added, setAdded] = useState(false);

  /* Subscribe to the ACTION only, never the whole store. `useCartStore()`
     with no selector re-renders this page on every cart change anywhere in
     the app; selecting `s.add` gives a stable function reference and zero
     re-renders. This is the single most common zustand performance mistake. */
  const addToCart = useCartStore((s) => s.add);

  const handleAdd = () => {
    if (!size) return;
    addToCart(product.slug, size);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current) return;

      if (prefersReducedMotion()) {
        gsap.set([".pd-image", ".pd-meta > *"], {
          clipPath: "inset(0% 0% 0% 0%)",
          autoAlpha: 1,
          y: 0,
        });
        return;
      }

      gsap
        .timeline()
        .from(".pd-image", {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 1.1,
          ease: "glide",
          stagger: 0.12,
        })
        .from(
          ".pd-meta > *",
          { y: 40, autoAlpha: 0, duration: 0.9, stagger: 0.07, ease: "hop" },
          0.2,
        );
    },
    { scope: ref },
  );

  const related = PRODUCTS.filter((p) => p.slug !== product.slug).slice(0, 3);

  return (
    <div ref={ref} className="edge pt-[16vh] pb-24">
      <nav
        aria-label="Breadcrumb"
        className="mb-8 font-mono text-xs uppercase tracking-[0.1em] opacity-55"
      >
        <Link href="/shop" className="hover:opacity-100">
          Shop
        </Link>
        <span aria-hidden> / </span>
        <span>{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        {/* GALLERY */}
        <div className="flex flex-col gap-4">
          {product.images.map((src, i) => (
            <div
              key={src + i}
              className="pd-image relative aspect-[3/4] w-full overflow-hidden bg-fg/5"
            >
              <Image
                src={src}
                alt={`${product.name} — view ${i + 1}`}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                /* Only the first image is above the fold on mobile. */
                priority={i === 0}
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {/* INFO — sticky on desktop so it stays with you while the gallery
            scrolls. `top-24` clears the fixed header. Plain CSS sticky is
            correct here; a JS pin would be pure overhead. */}
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <div className="pd-meta">
            <p className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
              {pad(product.id)} — {product.category}
            </p>

            <AnimatedText
              as="h1"
              split="chars"
              trigger="mount"
              staggerAmount={0.35}
              className="mt-2 text-[clamp(2.2rem,6vw,4.5rem)] leading-[0.92] font-bold tracking-[-0.04em]"
            >
              {product.name}
            </AnimatedText>

            <p className="mt-4 font-mono text-xl tabular-nums">
              {formatPrice(product.price, product.currency)}
            </p>

            <p className="mt-6 max-w-[46ch] text-base leading-relaxed opacity-80">
              {product.description}
            </p>

            {/* COLOURS */}
            <div className="mt-8">
              <p className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
                Colour
              </p>
              <div className="mt-3 flex gap-2">
                {product.colors.map((c) => (
                  <span
                    key={c.name}
                    title={c.name}
                    className="h-6 w-6 rounded-full border border-fg/20"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* SIZES — a radiogroup, not a row of divs. Keyboard users get
                arrow-key navigation for free from the native radio semantics
                that `role="radio"` + `aria-checked` expose. */}
            <div className="mt-8">
              <p
                id="size-label"
                className="font-mono text-xs uppercase tracking-[0.12em] opacity-50"
              >
                Size
              </p>
              <div
                role="radiogroup"
                aria-labelledby="size-label"
                className="mt-3 flex flex-wrap gap-2"
              >
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="radio"
                    aria-checked={size === s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-12 rounded-full border px-4 py-2 font-mono text-xs uppercase transition-colors duration-300",
                      size === s
                        ? "border-fg bg-fg text-bg"
                        : "border-fg/25 hover:border-fg",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-9 flex items-center gap-4">
              <MagneticButton
                onClick={handleAdd}
                disabled={product.soldOut || !size}
                aria-label={
                  product.soldOut
                    ? "Sold out"
                    : !size
                      ? "Select a size first"
                      : `Add ${product.name} to bag`
                }
              >
                {product.soldOut
                  ? "Sold out"
                  : added
                    ? "Added ✓"
                    : !size
                      ? "Select a size"
                      : "Add to bag"}
              </MagneticButton>
            </div>

            {/* SPEC LIST */}
            <dl className="mt-10 border-t border-fg/15">
              {product.details.map((detail) => (
                <div
                  key={detail}
                  className="flex gap-4 border-b border-fg/15 py-3 text-sm"
                >
                  <dt className="sr-only">Detail</dt>
                  <dd className="opacity-75">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>

      {/* RELATED */}
      <section className="mt-28">
        <h2 className="mb-8 border-b border-fg/15 pb-4 font-mono text-xs uppercase tracking-[0.12em] opacity-55">
          More from the drop
        </h2>
        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p, i) => (
            <ProductCard key={p.slug} product={p} index={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
