"use client";

import Link from "next/link";
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { FOOTER_COLUMNS, SITE, SOCIALS } from "@/data/data";
import AnimatedText from "@/components/ui/AnimatedText";

/**
 * FOOTER, with the oversized wordmark that wipes in on approach.
 *
 * The `clipPath` reveal here is scrubbed rather than fired once, so the giant
 * word literally fills in as you scroll the last screen — it gives the page a
 * definite ending instead of just running out of content.
 */
export default function Footer() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current || prefersReducedMotion()) return;

      gsap.fromTo(
        ".footer-wordmark",
        { clipPath: "inset(0% 0% 100% 0%)" },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          ease: "none",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 90%",
            end: "bottom bottom",
            scrub: 0.6,
          },
        },
      );
    },
    { scope: ref },
  );

  return (
    <footer ref={ref} className="edge border-t border-fg/15 pt-16 pb-8">
      <div className="grid gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="max-w-sm">
          <AnimatedText
            as="p"
            split="lines"
            className="text-lg leading-[1.3] font-medium"
          >
            {SITE.intro}
          </AnimatedText>
          <p className="mt-6 font-mono text-xs uppercase opacity-60">
            {SITE.location} · {SITE.year}
          </p>
        </div>

        {FOOTER_COLUMNS.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
              {col.title}
            </h2>
            <ul className="mt-4 space-y-2">
              {col.links.map((link, i) => (
                <li key={`${col.title}-${link.label}-${i}`}>
                  <Link
                    href={link.href}
                    className="group inline-block overflow-hidden text-sm font-medium"
                  >
                    <span className="block transition-transform duration-500 ease-[var(--ease-hop)] group-hover:-translate-y-full">
                      {link.label}
                    </span>
                    <span
                      aria-hidden
                      className="block transition-transform duration-500 ease-[var(--ease-hop)] group-hover:-translate-y-full"
                    >
                      {link.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap items-end justify-between gap-6 border-t border-fg/15 pt-6">
        <ul className="flex gap-5 font-mono text-xs uppercase">
          {SOCIALS.map((s) => (
            <li key={s.label}>
              <a
                href={s.href}
                target="_blank"
                rel="noreferrer noopener"
                className="transition-opacity hover:opacity-60"
              >
                {s.label} ↗
              </a>
            </li>
          ))}
        </ul>
        <a
          href={SITE.studioUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="font-mono text-xs uppercase transition-opacity hover:opacity-60"
        >
          Built by {SITE.studio} ↗
        </a>
      </div>

      {/* The full-bleed wordmark. `leading-[0.75]` and a negative bottom
          margin let the glyphs sit flush to the page edge — descenders would
          otherwise leave a band of dead space. */}
      <div className="mt-10 overflow-hidden">
        <h2
          aria-hidden
          className="footer-wordmark -mb-[0.08em] w-full text-center text-[18vw] leading-[0.75] font-bold tracking-[-0.05em] uppercase"
        >
          {SITE.wordmark}
        </h2>
      </div>
    </footer>
  );
}
