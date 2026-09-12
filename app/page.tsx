"use client";

import Preloader from "@/components/layout/Preloader";
import Hero from "@/components/home/Hero";
import Manifesto from "@/components/home/Manifesto";
import FeaturedGrid from "@/components/home/FeaturedGrid";
import HorizontalScroll from "@/components/home/HorizontalScroll";
import Lookbook from "@/components/home/Lookbook";
import Stats from "@/components/home/Stats";
import Newsletter from "@/components/home/Newsletter";
import Marquee from "@/components/ui/Marquee";
import { MARQUEE_ITEMS } from "@/data/data";

/**
 * HOME.
 *
 * SECTION ORDER IS A DESIGN DECISION, not an accident. The rhythm alternates
 * between "loud" and "quiet" so nothing competes:
 *
 *   Hero          full-bleed type      LOUD
 *   Marquee       motion, small type   transition beat
 *   Manifesto     pinned, sparse       QUIET — gives the eye somewhere to rest
 *   Featured      grid, product        content
 *   Horizontal    pinned, sideways     LOUD — the set piece
 *   Stats         numbers              transition beat
 *   Lookbook      parallax imagery     content
 *   Newsletter    form                 close
 *
 * Two pinned sections back-to-back would feel like being trapped; two grids
 * back-to-back would feel like a catalogue. The alternation IS the art
 * direction.
 */
export default function HomePage() {
  return (
    <>
      <Preloader />
      <Hero />
      <Marquee
        items={MARQUEE_ITEMS}
        className="border-y border-fg/15 py-4 text-sm font-semibold uppercase tracking-[0.06em]"
      />
      <Manifesto />
      <FeaturedGrid />
      <HorizontalScroll />
      <Stats />
      <Lookbook />
      <Marquee
        items={["OUTFIT®", "Signature collection", "++hellohello", "FW/26"]}
        reverse
        duration={34}
        className="border-y border-fg/15 py-4 text-[clamp(1.5rem,4vw,3rem)] font-bold uppercase tracking-[-0.02em]"
      />
      <Newsletter />
    </>
  );
}
