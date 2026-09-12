"use client";

import { useRef, type ElementType } from "react";
import { useGSAP } from "@gsap/react";
import {
  gsap,
  SplitText,
  registerGsap,
  prefersReducedMotion,
} from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  ANIMATED TEXT — the single most recognisable award-site effect
 * ============================================================================
 *
 *  HOW THE MASKED REVEAL ACTUALLY WORKS
 *
 *  Text does not "fade up" on these sites. Each line (or word, or character)
 *  sits inside a container with `overflow: hidden` and starts translated 100%
 *  DOWN — completely outside its own mask. Animating it to 0 makes it appear
 *  to rise out of nothing, with a hard edge. That hard edge is the whole
 *  effect: a fade looks soft and cheap, a mask looks typeset and deliberate.
 *
 *  SplitText's `mask: "lines"` option builds those wrapper elements for you.
 *  Before it existed you had to nest two spans per line by hand.
 *
 *  WHY `autoSplit` + `onSplit` MATTERS (GSAP 3.13+)
 *
 *  Splitting by LINE is a measurement: it depends on the element's width and
 *  on the font being loaded. Two things therefore break a naive split:
 *
 *    1. The web font swaps in after the split → lines re-wrap → your masks are
 *       now in the wrong places and text is clipped mid-word.
 *    2. The viewport is resized → same problem.
 *
 *  `autoSplit: true` makes SplitText re-split on font load and resize.
 *  But a re-split destroys the DOM nodes your old tween was animating, so the
 *  animation must be REBUILT each time — that is what `onSplit` is for.
 *  Returning the timeline from `onSplit` lets SplitText kill the previous one,
 *  which prevents the classic leak of a dozen orphaned timelines all fighting
 *  over elements that no longer exist.
 *
 *  ACCESSIBILITY
 *  Splitting text shatters it into dozens of spans, which screen readers may
 *  read letter-by-letter. `aria: "auto"` (SplitText's default behaviour here)
 *  restores a readable label on the parent, so the DOM can be confetti while
 *  the accessibility tree stays a sentence.
 */

type SplitKind = "chars" | "words" | "lines";

interface AnimatedTextProps {
  children: string;
  /** Rendered tag. Use the real heading level — motion is not an excuse for h1 soup. */
  as?: ElementType;
  className?: string;
  /** Granularity of the split. `lines` for paragraphs, `chars` for display type. */
  split?: SplitKind;
  /** Play on scroll (default) or immediately on mount. */
  trigger?: "scroll" | "mount" | "none";
  /** Seconds to wait before playing. */
  delay?: number;
  /** Total time the stagger is spread across. */
  staggerAmount?: number;
  /** Where the stagger starts from. "random" is the OUTFIT wordmark look. */
  from?: "start" | "end" | "center" | "random";
  /** Rotate each piece slightly as it rises — subtle extra life on big type. */
  skew?: boolean;
}

export default function AnimatedText({
  children,
  as: Tag = "span",
  className,
  split = "lines",
  trigger = "scroll",
  delay = 0,
  staggerAmount = 0.5,
  from = "start",
  skew = false,
}: AnimatedTextProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (!ref.current || trigger === "none") return;

      const reduced = prefersReducedMotion();

      SplitText.create(ref.current, {
        type: split,
        mask: split,
        /* Re-split when the font loads or the box resizes. Only meaningful for
           line splits, but harmless elsewhere. */
        autoSplit: true,
        aria: "auto",
        /* Collapse runs of whitespace so a stray newline in JSX does not
           become a visible gap. */
        reduceWhiteSpace: true,
        /**
         * ⚠ MANDATORY WHEN SPLITTING BY CHARACTER.
         *
         * A char split turns every glyph into its own inline-block, which
         * destroys the browser's notion of a word — so it will happily break a
         * line BETWEEN TWO LETTERS. You get headings like
         * "Whitespac / e Matters" and it looks like a rendering bug, because
         * it is one.
         *
         * `smartWrap` wraps each word in an extra `white-space: nowrap` span,
         * restoring word integrity while leaving `self.chars` intact to
         * animate. Costs one wrapper element per word; non-negotiable on any
         * multi-word char split.
         */
        smartWrap: split === "chars",

        onSplit: (self) => {
          const pieces = self[split] as Element[];
          if (!pieces.length) return;

          /* Reduced motion: land in the final state immediately. We still run
             a tween (rather than skipping) so the element is definitely
             visible — a skipped `from` tween would leave it at yPercent 100. */
          if (reduced) {
            return gsap.set(pieces, { yPercent: 0, rotate: 0, opacity: 1 });
          }

          return gsap.from(pieces, {
            yPercent: 110,
            rotate: skew ? 6 : 0,
            duration: 0.9,
            ease: "hop",
            delay,
            stagger: { amount: staggerAmount, from },
            /* ScrollTrigger is attached INSIDE onSplit so a re-split
               re-measures the trigger too. Creating it outside would leave a
               trigger pointing at the pre-split geometry. */
            scrollTrigger:
              trigger === "scroll"
                ? {
                    trigger: ref.current,
                    /* "top 85%" = fire when the element's top reaches 85% down
                       the viewport, i.e. just as it becomes visible. Firing at
                       "top bottom" (the moment a single pixel enters) means
                       the animation is often over before the user can see it. */
                    start: "top 85%",
                    once: true,
                  }
                : undefined,
          });
        },
      });

      /* No manual cleanup needed: useGSAP's gsap.context() reverts every
         tween, ScrollTrigger and SplitText created inside this callback when
         the component unmounts. */
    },
    { scope: ref, dependencies: [children, split, trigger] },
  );

  return (
    <Tag ref={ref} className={cn(className)}>
      {children}
    </Tag>
  );
}
