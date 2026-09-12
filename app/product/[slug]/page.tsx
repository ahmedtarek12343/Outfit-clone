import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PRODUCTS, getProductBySlug } from "@/data/data";
import ProductDetail from "./ProductDetail";

/**
 * ============================================================================
 *  PRODUCT PAGE — a Server Component wrapping a Client Component
 * ============================================================================
 *
 *  ⚠ NEXT.JS 16 BREAKING CHANGE
 *  `params` and `searchParams` are now PROMISES. In 15 they were sync with a
 *  deprecation warning; in 16 the sync access is gone entirely. So:
 *
 *      ✗ export default function Page({ params }) { params.slug }
 *      ✓ export default async function Page({ params }) {
 *            const { slug } = await params
 *        }
 *
 *  The same applies to `cookies()`, `headers()` and `draftMode()`, and to the
 *  `params` passed to `generateMetadata`, `icon`, `opengraph-image` and
 *  `sitemap`'s `id`.
 *
 *  ── WHY SPLIT THE PAGE IN TWO? ─────────────────────────────────────────────
 *
 *  The animation and the size picker need hooks, so they must be a Client
 *  Component. But the DATA LOOKUP, the `notFound()` call and the metadata
 *  belong on the server. Keeping this file a Server Component means:
 *
 *    • `generateStaticParams` can prerender all eight product pages at build
 *      time — they are then served as static HTML
 *    • the product data never ships to the browser as a serialised blob beyond
 *      the one product actually being viewed
 *    • SEO metadata is real server-rendered metadata
 *
 *  This "server shell / client island" split is the pattern to reach for
 *  whenever a page is mostly static but has an interactive core.
 */

/**
 * Prerender every product route at build time.
 *
 * Without this, a dynamic route is rendered on demand, which — per the Next 16
 * navigation docs — also means it cannot be fully prefetched on hover, so the
 * transition into it stalls. For a fixed catalogue there is no reason not to
 * generate them all.
 */
export function generateStaticParams() {
  return PRODUCTS.map((product) => ({ slug: product.slug }));
}

/** Per-product metadata. Note `params` is awaited here too. */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Not found" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.images[0] }],
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);

  /* `notFound()` renders the nearest not-found.tsx and sends a real 404
     status. Returning your own "not found" markup would send a 200, which
     tells search engines the page exists. */
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
