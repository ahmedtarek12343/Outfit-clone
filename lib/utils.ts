/** Tiny class-name joiner. Avoids pulling clsx/tailwind-merge for 12 lines. */
export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** Format a price the way the store displays it. */
export function formatPrice(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/** Zero-padded ordinal, e.g. 3 -> "03". Used for the monospace index labels. */
export function pad(n: number, size = 2) {
  return String(n).padStart(size, "0");
}
