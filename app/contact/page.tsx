"use client";

import { SITE, SOCIALS } from "@/data/data";
import AnimatedText from "@/components/ui/AnimatedText";
import MagneticButton from "@/components/ui/MagneticButton";
import ScrollReveal from "@/components/ui/ScrollReveal";
import Marquee from "@/components/ui/Marquee";

/**
 * CONTACT.
 *
 * One idea worth noting: the giant mailto link uses the two-stacked-labels
 * hover swap at display size. At 8vw the 100%-translate travel is large, so
 * the duration is longer (700ms) than it would be on a nav link — otherwise
 * the text appears to teleport. Motion duration should scale with distance,
 * not be a constant you paste everywhere.
 */
export default function ContactPage() {
  return (
    <div className="pt-[16vh] pb-24">
      <header className="edge">
        <AnimatedText
          as="h1"
          split="chars"
          trigger="mount"
          from="random"
          staggerAmount={0.5}
          className="text-[clamp(3rem,13vw,11rem)] leading-[0.82] font-bold tracking-[-0.045em] uppercase"
        >
          Contact
        </AnimatedText>
      </header>

      <section className="edge mt-16 border-t border-fg/15 pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
          Write to us
        </p>

        <a
          href={`mailto:${SITE.email}`}
          className="group mt-4 block overflow-hidden"
        >
          <span className="block text-[clamp(1.6rem,8vw,6rem)] leading-[1.05] font-bold tracking-[-0.04em] transition-transform duration-700 ease-[var(--ease-hop)] group-hover:-translate-y-full">
            {SITE.email}
          </span>
          <span
            aria-hidden
            className="block text-[clamp(1.6rem,8vw,6rem)] leading-[1.05] font-bold tracking-[-0.04em] opacity-40 transition-transform duration-700 ease-[var(--ease-hop)] group-hover:-translate-y-full"
          >
            {SITE.email}
          </span>
        </a>
      </section>

      <ScrollReveal
        mode="up"
        stagger={0.1}
        className="edge mt-20 grid gap-10 md:grid-cols-3"
      >
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
            Studio
          </h2>
          <p className="mt-3 text-lg font-semibold">{SITE.studio}</p>
          <p className="opacity-70">{SITE.location}</p>
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
            Elsewhere
          </h2>
          <ul className="mt-3 space-y-1">
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
        </div>
        <div>
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] opacity-50">
            Shipping &amp; returns
          </h2>
          <p className="mt-3 max-w-[34ch] leading-relaxed opacity-75">
            Worldwide, free over $150. Unworn pieces can be returned within 30
            days — mail us first and we will send a label.
          </p>
          <div className="mt-5">
            <MagneticButton href="/shop" variant="outline" strength={14}>
              Back to the shop
            </MagneticButton>
          </div>
        </div>
      </ScrollReveal>

      <Marquee
        items={[SITE.email, "Collaborations welcome", SITE.location]}
        duration={30}
        className="mt-24 border-y border-fg/15 py-4 text-[clamp(1.2rem,3vw,2.2rem)] font-bold uppercase"
      />
    </div>
  );
}
