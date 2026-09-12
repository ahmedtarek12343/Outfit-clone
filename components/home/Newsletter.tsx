"use client";

import { useState } from "react";
import AnimatedText from "@/components/ui/AnimatedText";
import MagneticButton from "@/components/ui/MagneticButton";

/**
 * NEWSLETTER.
 *
 * Not wired to a backend — but it is a real form with real validation states,
 * because a dead input is the fastest way to make a beautiful site feel fake.
 * The submit handler is where you would call a route handler / server action.
 */
export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="edge py-24 md:py-32">
      <div className="grid gap-10 md:grid-cols-2 md:items-end">
        <AnimatedText
          as="h2"
          split="lines"
          className="max-w-[20ch] text-[clamp(2rem,6vw,4.5rem)] leading-[0.98] font-bold tracking-[-0.035em]"
        >
          Get told first when the next run lands.
        </AnimatedText>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSent(true);
          }}
          className="flex flex-col gap-4"
        >
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <div className="flex items-center gap-4 border-b border-fg/30 pb-3 focus-within:border-fg">
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@studio.com"
              className="w-full bg-transparent text-lg outline-none placeholder:opacity-35"
            />
            <MagneticButton type="submit" strength={10} disabled={sent}>
              {sent ? "Done" : "Join"}
            </MagneticButton>
          </div>
          <p
            /* aria-live means a screen reader announces the confirmation
               without the focus having to move. */
            aria-live="polite"
            className="font-mono text-xs uppercase tracking-[0.1em] opacity-60"
          >
            {sent ? "You are on the list." : "No more than once a month."}
          </p>
        </form>
      </div>
    </section>
  );
}
