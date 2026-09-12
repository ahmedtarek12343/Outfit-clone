import Link from "next/link";
import { SITE } from "@/data/data";

/**
 * 404.
 *
 * A Server Component on purpose: nothing here needs hooks, so there is no
 * reason to ship JS for it. Note that `not-found.tsx` is also what
 * `notFound()` renders, which is why the product page can rely on it.
 */
export default function NotFound() {
  return (
    <div className="edge flex min-h-screen flex-col justify-center py-24">
      <p className="font-mono text-xs uppercase tracking-[0.12em] opacity-55">
        Error 404
      </p>
      <h1 className="mt-3 text-[clamp(3rem,16vw,12rem)] leading-[0.82] font-bold tracking-[-0.045em] uppercase">
        Not here
      </h1>
      <p className="mt-6 max-w-[40ch] text-lg opacity-75">
        That page does not exist — or the piece sold out and we retired the
        page with it.
      </p>
      <div className="mt-8 flex gap-4 font-mono text-xs uppercase tracking-[0.1em]">
        <Link href="/" className="underline decoration-1 underline-offset-4 hover:opacity-60">
          Index
        </Link>
        <Link href="/shop" className="underline decoration-1 underline-offset-4 hover:opacity-60">
          Shop
        </Link>
      </div>
      <p className="mt-16 font-mono text-xs uppercase opacity-40">
        {SITE.name} — {SITE.year}
      </p>
    </div>
  );
}
