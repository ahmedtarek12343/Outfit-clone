"use client";

import { useEffect, useRef } from "react";
import fitty from "fitty";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  SplitText,
  registerGsap,
  prefersReducedMotion,
} from "@/lib/gsap";
import { ABOUT, FAQ, SITE } from "@/data/data";
import AnimatedText from "@/components/ui/AnimatedText";
import Accordion from "@/components/ui/Accordion";
import ScrollReveal from "@/components/ui/ScrollReveal";
import ParallaxImage from "@/components/ui/ParallaxImage";

/**
 * ============================================================================
 *  STUDIO PAGE — the fitty demo, and the scrubbed word-highlight
 * ============================================================================
 *
 *  ── WHEN TO USE A JS TEXT FITTER ───────────────────────────────────────────
 *
 *  The hero uses a calibrated `vw` font-size because the word is a constant
 *  ("Outfit", six characters, forever). Here the heading is a longer word and
 *  could change with the copy, so a hand-tuned `vw` value would be wrong the
 *  moment anyone edits it. `fitty` measures the text and sets `font-size` so
 *  it exactly fills its container — correct for ANY string.
 *
 *  THE ORDERING RULE: fitty and SplitText both want to own this element's
 *  layout. Split first and fitty measures a container full of spans and gets
 *  the wrong answer. So:
 *
 *      1. fitty sizes the text
 *      2. wait for its "fit" event
 *      3. THEN split and animate
 *
 *  We use two separate elements below to keep that simple — the fitted word is
 *  not the split one. When you must do both to the same element, listen for
 *  fitty's `fit` event before calling SplitText.
 */
export default function AboutPage() {
  const fitRef = useRef<HTMLHeadingElement>(null);
  const leadRef = useRef<HTMLDivElement>(null);

  /* fitty in a plain effect, with cleanup. `unsubscribe()` removes its resize
     observer — without it, navigating away leaves a listener measuring a
     detached node on every resize for the rest of the session. */
  useEffect(() => {
    if (!fitRef.current) return;
    /* Passing an ELEMENT returns a single instance; passing a SELECTOR
       STRING returns an array. Easy to get wrong — the types catch it. */
    const instance = fitty(fitRef.current, {
      minSize: 24,
      maxSize: 400,
      /* Multi-line would defeat the point; this must be one line. */
      multiLine: false,
    });
    return () => instance.unsubscribe();
  }, []);

  /* THE SCRUBBED WORD HIGHLIGHT.
     Same mechanic as the home page manifesto, but applied to a real paragraph
     and driven by the paragraph's own pass through the viewport rather than a
     pin. Cheaper, less intrusive, and appropriate for body copy — you would
     not want to pin the page for a lead paragraph. */
  useGSAP(
    () => {
      registerGsap();
      if (!leadRef.current) return;

      if (prefersReducedMotion()) {
        gsap.set(".about-lead", { opacity: 1 });
        return;
      }

      const split = SplitText.create(".about-lead", {
        type: "words",
        autoSplit: true,
        aria: "auto",
        onSplit: (self) =>
          gsap.fromTo(
            self.words,
            { opacity: 0.15 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.4,
              scrollTrigger: {
                trigger: leadRef.current,
                start: "top 75%",
                end: "bottom 45%",
                scrub: true,
              },
            },
          ),
      });

      return () => split.revert();
    },
    { scope: leadRef },
  );

  return (
    <div className="pb-24 pt-[16vh]">
      {/*
        THE FITTED HEADING — two non-obvious requirements.

        fitty's whole algorithm is one line:

            newFontSize = parent.clientWidth / element.scrollWidth × fontSize

        Both operands have to be right, and it is easy to break either:

        1. NO WIDTH CLASS ON THE ELEMENT.
           With `w-full`, the h1's `scrollWidth` reports the CONTAINER width
           instead of the text's natural width, the ratio comes out as ~1, and
           fitty concludes the text already fits — collapsing it to `minSize`.
           fitty sets `display: inline-block` itself, so the element must be
           left free to size to its own content.

        2. AN UNPADDED PARENT.
           fitty measures `parentNode.clientWidth`, and clientWidth INCLUDES
           padding. Measured against the padded `.edge` header it would return
           1440 instead of the 1360 of usable space, and the text would grow
           straight through the page gutters. Hence this bare wrapper div: it
           gives fitty the true content width to aim at.
      */}
      <header className="edge">
        <div>
          <h1
            ref={fitRef}
            className="font-bold uppercase leading-[0.8] tracking-[-0.04em] whitespace-nowrap"
          >
            {ABOUT.heading} — {SITE.location}
          </h1>
        </div>
      </header>

      <div ref={leadRef} className="edge mt-16 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <p className="about-lead max-w-[40ch] text-[clamp(1.4rem,3.2vw,2.4rem)] leading-[1.15] font-semibold tracking-[-0.02em]">
          {ABOUT.lead}
        </p>

        <ScrollReveal mode="up" stagger={0.12} className="space-y-5 md:pt-3">
          {ABOUT.paragraphs.map((p) => (
            <p key={p.slice(0, 24)} className="max-w-[48ch] leading-relaxed opacity-80">
              {p}
            </p>
          ))}
        </ScrollReveal>
      </div>

      <div className="edge mt-20 grid gap-6 md:grid-cols-2">
        <ParallaxImage
          src="/image-03.avif"
          alt="Studio rail"
          strength={16}
          className="aspect-[4/5] w-full"
        />
        <ParallaxImage
          src="/image-05.avif"
          alt="Fabric swatches"
          strength={-12}
          zoom
          className="aspect-[4/5] w-full md:mt-20"
        />
      </div>

      {/* CREDITS — a definition list, because that is genuinely what it is. */}
      <section className="edge mt-24">
        <h2 className="border-b border-fg/15 pb-4 font-mono text-xs uppercase tracking-[0.12em] opacity-55">
          Credits
        </h2>
        <dl className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-4">
          {ABOUT.credits.map((c) => (
            <div key={c.role} className="border-b border-fg/15 py-5">
              <dt className="font-mono text-xs uppercase tracking-[0.1em] opacity-50">
                {c.role}
              </dt>
              <dd className="mt-1 text-lg font-semibold">{c.name}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="edge mt-24">
        <AnimatedText
          as="h2"
          split="chars"
          staggerAmount={0.4}
          className="mb-8 text-[clamp(2rem,6vw,4rem)] leading-[0.95] font-bold tracking-[-0.035em] uppercase"
        >
          Questions
        </AnimatedText>
        <Accordion items={FAQ} />
      </section>
    </div>
  );
}
