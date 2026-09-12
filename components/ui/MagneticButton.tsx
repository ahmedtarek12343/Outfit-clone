"use client";

import { useRef, type ReactNode } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  MAGNETIC BUTTON — and why `quickTo` instead of `gsap.to`
 * ============================================================================
 *
 *  A magnetic button leans toward the cursor. `mousemove` fires up to 120×/s,
 *  so the implementation detail matters enormously:
 *
 *    ✗ gsap.to(el, {x, y})  — allocates a brand new tween object on every
 *      mouse move. Each one has to be instantiated, inserted into the global
 *      timeline, and garbage collected. Dozens per second. It works, and it
 *      is the #1 source of "why does this site heat up my laptop".
 *
 *    ✓ gsap.quickTo(el, "x", {...})  — creates ONE reusable tween up front and
 *      returns a setter. Calling it just re-targets that tween. Zero
 *      allocation per move. This is the API GSAP added specifically for
 *      pointer-driven animation.
 *
 *  The `duration` on quickTo is what produces the lag/elasticity: the element
 *  is always easing toward the cursor rather than tracking it rigidly, which
 *  is what makes it feel physical.
 *
 *  The label is offset FURTHER than the button (`strength * 1.6`) so the text
 *  appears to lead the movement. That tiny difference in travel is what sells
 *  the effect as depth instead of a flat slide.
 */

interface MagneticButtonProps {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  /** Max pixels of pull. */
  strength?: number;
  variant?: "solid" | "outline";
  disabled?: boolean;
  type?: "button" | "submit";
  "aria-label"?: string;
}

export default function MagneticButton({
  children,
  href,
  onClick,
  className,
  strength = 18,
  variant = "solid",
  disabled = false,
  type = "button",
  ...rest
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      const el = ref.current;
      if (!el || prefersReducedMotion() || disabled) return;

      const label = el.querySelector<HTMLElement>("[data-magnetic-label]");

      /* Create the reusable setters ONCE. */
      const moveX = gsap.quickTo(el, "x", { duration: 0.5, ease: "power3" });
      const moveY = gsap.quickTo(el, "y", { duration: 0.5, ease: "power3" });
      const labelX = label
        ? gsap.quickTo(label, "x", { duration: 0.7, ease: "power3" })
        : null;
      const labelY = label
        ? gsap.quickTo(label, "y", { duration: 0.7, ease: "power3" })
        : null;

      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        /* Cursor offset from the button's centre, normalised to -1..1 so the
           pull is the same proportion regardless of button size. */
        const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);

        moveX(dx * strength);
        moveY(dy * strength);
        labelX?.(dx * strength * 0.6);
        labelY?.(dy * strength * 0.6);
      };

      const onLeave = () => {
        moveX(0);
        moveY(0);
        labelX?.(0);
        labelY?.(0);
      };

      /* Listening on the element (not the window) means no work at all happens
         while the cursor is elsewhere on the page. */
      el.addEventListener("mousemove", onMove);
      el.addEventListener("mouseleave", onLeave);

      return () => {
        el.removeEventListener("mousemove", onMove);
        el.removeEventListener("mouseleave", onLeave);
      };
    },
    { scope: ref, dependencies: [strength, disabled] },
  );

  const base = cn(
    "relative inline-flex items-center justify-center overflow-hidden rounded-full",
    "px-7 py-3.5 text-sm font-semibold uppercase tracking-[0.08em]",
    "transition-colors duration-500 ease-[var(--ease-hop)]",
    variant === "solid"
      ? "bg-fg text-bg hover:bg-fg/90"
      : "border border-fg/30 text-fg hover:border-fg",
    disabled && "pointer-events-none opacity-40",
    className,
  );

  const inner = (
    <span data-magnetic-label className="relative z-10 block">
      {children}
    </span>
  );

  /* The wrapper div is what gets transformed; the interactive element sits
     inside it. Transforming a <button> directly fights the browser's own
     active/focus styling in some engines. */
  return (
    <div ref={ref} className="inline-block will-change-transform">
      {href ? (
        <Link href={href} className={base} {...rest}>
          {inner}
        </Link>
      ) : (
        <button type={type} onClick={onClick} disabled={disabled} className={base} {...rest}>
          {inner}
        </button>
      )}
    </div>
  );
}
