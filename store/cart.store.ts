/**
 * Cart store — enough commerce to make the Flip-based "add to bag" animation
 * meaningful. No payment integration; the bag page is a real, working list.
 */
import { create } from "zustand";
import { PRODUCTS, type Product } from "@/data/data";

export interface CartLine {
  /** `${slug}-${size}` — the same product in two sizes is two lines. */
  key: string;
  slug: string;
  size: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  /** Bumped on every add; the nav badge watches it to trigger a pop. */
  addPulse: number;
  add: (slug: string, size: string) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  lines: [],
  addPulse: 0,

  add: (slug, size) =>
    set((state) => {
      const key = `${slug}-${size}`;
      const existing = state.lines.find((l) => l.key === key);
      return {
        addPulse: state.addPulse + 1,
        lines: existing
          ? state.lines.map((l) =>
              l.key === key ? { ...l, qty: l.qty + 1 } : l,
            )
          : [...state.lines, { key, slug, size, qty: 1 }],
      };
    }),

  remove: (key) =>
    set((state) => ({ lines: state.lines.filter((l) => l.key !== key) })),

  setQty: (key, qty) =>
    set((state) => ({
      lines:
        qty <= 0
          ? state.lines.filter((l) => l.key !== key)
          : state.lines.map((l) => (l.key === key ? { ...l, qty } : l)),
    })),

  clear: () => set({ lines: [] }),
}));

/* ---- Derived selectors -------------------------------------------------- */
/*
 * ⚠ THE ZUSTAND SELECTOR RULE THAT WILL BITE YOU
 *
 * A selector MUST return a stable reference for unchanged state.
 *
 * zustand v5 is built on React's `useSyncExternalStore`, which compares the
 * previous and next snapshot with `Object.is`. If a selector builds a NEW
 * object or array every time it runs:
 *
 *     const lines = useCartStore((s) => s.lines.map(joinProduct));  // ✗
 *
 * ...then every call produces a reference React has never seen. React
 * concludes the store changed, re-renders, calls the selector again, gets
 * another new array, re-renders again — and you get
 * "Maximum update depth exceeded" (React error #185). An INFINITE LOOP, from
 * a selector that looks completely innocent.
 *
 * Three correct options:
 *   1. Return primitives only (the two `reduce`s below — a number is stable).
 *   2. Select the raw state and derive in the component with `useMemo`.
 *      ← what the bag page does, via `joinLines` below
 *   3. Wrap the selector in `useShallow` from "zustand/react/shallow", which
 *      swaps `Object.is` for a shallow comparison.
 *
 * Never option 4: hand a freshly-built object straight back from a selector.
 */

export const selectCount = (s: CartState) =>
  s.lines.reduce((n, l) => n + l.qty, 0);

export const selectSubtotal = (s: CartState) =>
  s.lines.reduce((sum, l) => {
    const product = PRODUCTS.find((p) => p.slug === l.slug);
    return sum + (product ? product.price * l.qty : 0);
  }, 0);

/**
 * Join cart lines to their product records.
 *
 * Deliberately NOT a zustand selector — it is a plain function the component
 * calls inside `useMemo` over the stable `lines` array. Same result, no
 * render loop.
 */
export function joinLines(
  lines: CartLine[],
): Array<CartLine & { product: Product }> {
  return lines.flatMap((line) => {
    const product = PRODUCTS.find((p) => p.slug === line.slug);
    return product ? [{ ...line, product }] : [];
  });
}
