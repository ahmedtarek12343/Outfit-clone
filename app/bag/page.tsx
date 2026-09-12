"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, joinLines, selectSubtotal } from "@/store/cart.store";
import { formatPrice } from "@/lib/utils";
import AnimatedText from "@/components/ui/AnimatedText";
import MagneticButton from "@/components/ui/MagneticButton";

/**
 * BAG.
 *
 * A note on hydration: this list comes from a client-only store that starts
 * empty, so the server HTML and the first client render agree (both empty) and
 * there is no mismatch. If you later persist the cart to localStorage — via
 * zustand's `persist` middleware — the server would render an empty bag and
 * the client a full one, and you MUST then either gate on a mounted flag or
 * use the same inline-script trick the theme uses. Persisting state that
 * affects server-rendered markup is the most common source of hydration
 * errors in this kind of app.
 */
export default function BagPage() {
  /* Select the RAW array (a stable reference straight out of the store) and
     join it to product records in a memo. Doing the join inside the selector
     would return a new array on every call and spin React into an infinite
     re-render — see the long note in store/cart.store.ts. */
  const rawLines = useCartStore((s) => s.lines);
  const lines = useMemo(() => joinLines(rawLines), [rawLines]);
  const subtotal = useCartStore(selectSubtotal);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);

  return (
    <div className="edge pt-[16vh] pb-24">
      <header className="border-b border-fg/15 pb-6">
        <AnimatedText
          as="h1"
          split="chars"
          trigger="mount"
          staggerAmount={0.4}
          className="text-[clamp(3rem,13vw,11rem)] leading-[0.82] font-bold tracking-[-0.045em] uppercase"
        >
          Bag
        </AnimatedText>
      </header>

      {lines.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.12em] opacity-55">
            Your bag is empty
          </p>
          <div className="mt-6 flex justify-center">
            <MagneticButton href="/shop">Browse the drop</MagneticButton>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-8">
            {lines.map((line) => (
              <li
                key={line.key}
                className="flex items-center gap-5 border-b border-fg/15 py-5"
              >
                <Link
                  href={`/product/${line.slug}`}
                  className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden bg-fg/5"
                >
                  <Image
                    src={line.product.images[0]}
                    alt={line.product.name}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/product/${line.slug}`}
                    className="font-semibold hover:opacity-70"
                  >
                    {line.product.name}
                  </Link>
                  <p className="font-mono text-xs uppercase tracking-[0.1em] opacity-55">
                    {line.product.category} · Size {line.size}
                  </p>
                </div>

                {/* Quantity stepper. Buttons, not a number input: a native
                    number input on mobile opens a keyboard and lets someone
                    type "99999". */}
                <div className="flex items-center gap-3 font-mono text-sm">
                  <button
                    type="button"
                    aria-label={`Decrease quantity of ${line.product.name}`}
                    onClick={() => setQty(line.key, line.qty - 1)}
                    className="h-7 w-7 rounded-full border border-fg/25 transition-colors hover:border-fg"
                  >
                    −
                  </button>
                  <span className="w-4 text-center tabular-nums">{line.qty}</span>
                  <button
                    type="button"
                    aria-label={`Increase quantity of ${line.product.name}`}
                    onClick={() => setQty(line.key, line.qty + 1)}
                    className="h-7 w-7 rounded-full border border-fg/25 transition-colors hover:border-fg"
                  >
                    +
                  </button>
                </div>

                <p className="w-20 shrink-0 text-right font-mono text-sm tabular-nums">
                  {formatPrice(line.product.price * line.qty)}
                </p>

                <button
                  type="button"
                  onClick={() => remove(line.key)}
                  aria-label={`Remove ${line.product.name}`}
                  className="font-mono text-xs uppercase opacity-50 transition-opacity hover:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-[34ch] font-mono text-xs uppercase tracking-[0.1em] opacity-55">
              Shipping calculated at checkout. Free over $150.
            </p>
            <div className="text-right">
              <p className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
                Subtotal
              </p>
              <p className="text-3xl font-bold tabular-nums">
                {formatPrice(subtotal)}
              </p>
              <div className="mt-4">
                <MagneticButton>Checkout</MagneticButton>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
