"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { CHAPTERS } from "@/data/data";

/**
 * ============================================================================
 *  HORIZONTAL SCROLL SECTION
 * ============================================================================
 *
 *  The trick is that NOTHING scrolls horizontally. The section is pinned, and
 *  vertical scroll input is translated into an `x` tween on the inner track.
 *  The visitor scrolls down; the content moves sideways.
 *
 *  ── THE ONE FORMULA YOU NEED ───────────────────────────────────────────────
 *
 *      xPercent: -100 * (panels - 1)
 *
 *  Each panel is `100vw` (`w-screen`), so the track is `panels × 100vw` wide.
 *  `xPercent` is relative to the TRACK's own width, so -100% would scroll the
 *  entire track off-screen. You want to stop when the LAST panel is in view,
 *  which is (panels - 1) panel-widths of travel. With 4 panels that is -300%.
 *
 *      end: "+=" + (track.offsetWidth - window.innerWidth)
 *
 *  Setting the scroll distance to the actual pixel overflow makes the mapping
 *  1:1 — one pixel of vertical scroll moves the track one pixel sideways. Any
 *  other value makes horizontal motion faster or slower than the visitor's
 *  gesture, which feels wrong even when people cannot say why.
 *
 *  ── WHY IT IS WRAPPED IN gsap.matchMedia() ─────────────────────────────────
 *
 *  Horizontal hijacking is hostile on a phone: it competes with the browser's
 *  own gestures and there is no room for a 100vw panel anyway. `matchMedia`
 *  builds the animation ONLY on desktop, and — crucially — automatically
 *  reverts it if the viewport crosses the breakpoint mid-session. Doing this
 *  with a plain `if (window.innerWidth > 768)` leaves a dead pinned section
 *  behind when someone resizes.
 *
 *  On mobile the same markup degrades to a native horizontal swipe strip
 *  (`overflow-x-auto` + scroll snap), which is what a phone user actually
 *  wants.
 */
export default function HorizontalScroll() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const section = ref.current;
      if (!section || prefersReducedMotion()) return;

      const track = section.querySelector<HTMLElement>("[data-track]");
      if (!track) return;

      /* Desktop only. The returned cleanup runs when the query stops matching. */
      const mm = gsap.matchMedia();

      mm.add("(min-width: 768px)", () => {
        const panels = gsap.utils.toArray<HTMLElement>("[data-panel]", track);

        const tween = gsap.to(track, {
          xPercent: -100 * (panels.length - 1),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            /* 1:1 pixel mapping — recomputed on every refresh, which is why
               it is a FUNCTION and paired with invalidateOnRefresh. */
            end: () => "+=" + (track.offsetWidth - window.innerWidth),
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        /* A nested scrub: each panel's image drifts inside its own frame as it
           crosses the screen, driven by the CONTAINER animation rather than by
           scroll directly. `containerAnimation` is the ScrollTrigger feature
           that makes this possible — it lets a trigger observe an element's
           position inside a horizontally-tweened track instead of inside the
           viewport. Without it, every panel would fire its trigger at once
           (they are all "in view" the whole time the section is pinned). */
        panels.forEach((panel) => {
          const image = panel.querySelector<HTMLElement>("[data-panel-image]");
          if (!image) return;
          gsap.fromTo(
            image,
            { xPercent: -8, scale: 1.15 },
            {
              xPercent: 8,
              scale: 1,
              ease: "none",
              scrollTrigger: {
                trigger: panel,
                containerAnimation: tween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          );
        });

        return () => {
          /* matchMedia reverts the tweens; killing the triggers explicitly
             keeps ScrollTrigger's internal list clean on breakpoint changes. */
          ScrollTrigger.getAll()
            .filter((st) => st.trigger === section || panels.includes(st.trigger as HTMLElement))
            .forEach((st) => st.kill());
        };
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section ref={ref} className="relative overflow-hidden md:overflow-visible">
      <div
        data-track
        className={
          /* Mobile: a real horizontal scroller with snap points.
             Desktop: a flex track that GSAP translates. */
          "flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-6 " +
          "md:h-screen md:snap-none md:gap-0 md:overflow-x-visible md:px-0 md:pb-0 md:will-change-transform"
        }
      >
        {CHAPTERS.map((chapter) => (
          <article
            data-panel
            key={chapter.index}
            className="flex w-[85vw] shrink-0 snap-center flex-col justify-center md:h-screen md:w-screen md:flex-row md:items-center md:gap-16 md:px-[6vw]"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden md:h-[62vh] md:w-[34vw]">
              <div data-panel-image className="absolute inset-0">
                <Image
                  src={chapter.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 85vw, 34vw"
                  className="object-cover"
                />
              </div>
            </div>

            <div className="mt-6 md:mt-0 md:max-w-[30ch]">
              <p className="font-mono text-xs uppercase tracking-[0.14em] opacity-50">
                Chapter {chapter.index}
              </p>
              <h3 className="mt-3 text-[clamp(1.8rem,4vw,3.5rem)] leading-[1.02] font-bold tracking-[-0.03em]">
                {chapter.title}
              </h3>
              <p className="mt-4 text-base leading-relaxed opacity-75">
                {chapter.copy}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
