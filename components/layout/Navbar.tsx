"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, prefersReducedMotion } from "@/lib/gsap";
import { NAV_LINKS, SITE } from "@/data/data";
import { useIntroStore } from "@/store/intro.store";
import { useCartStore, selectCount } from "@/store/cart.store";
import ThemeSwitcher from "./ThemeSwitcher";
import { cn } from "@/lib/utils";

/**
 * ============================================================================
 *  NAVBAR
 * ============================================================================
 *
 *  THE mix-blend-difference TRICK
 *  The nav sits over cream sections, black images and blue panels. Writing
 *  per-section colour logic for that is miserable. Instead the whole header is
 *  `mix-blend-difference`, which inverts whatever is behind it, so it is
 *  legible over anything — automatically. Two rules to remember:
 *
 *    1. The blended element must NOT be inside anything that creates a new
 *       stacking context with its own background, or it blends against that
 *       instead of the page. That is why the header is a direct child of
 *       <body> in layout.tsx, OUTSIDE the transition wrapper.
 *    2. The header must have no background of its own — a background is what
 *       it would blend against.
 *
 *  THE HOVER: TWO STACKED LABELS
 *  Each link contains the same text twice in an `overflow-hidden` box. On
 *  hover, both slide up by 100%: copy #1 leaves through the top, copy #2
 *  arrives from the bottom. This is pure CSS (group-hover + translate), so it
 *  is instant, interruption-proof, and costs no JS. Reach for GSAP only when
 *  the motion needs state or physics — a hover swap needs neither.
 */
export default function Navbar() {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const introDone = useIntroStore((s) => s.introDone);
  const count = useCartStore(selectCount);
  const [menuOpen, setMenuOpen] = useState(false);

  /**
   * Should the nav hide and then drop in?
   *
   * ONLY when an intro is genuinely going to play — which is only ever on the
   * home route, because that is the only page that renders a <Preloader/>.
   * Asking `usePathname()` here (rather than baking the route into the store)
   * keeps the store's initial state identical on server and client, so there
   * is no hydration mismatch. See the long note in store/intro.store.ts.
   *
   * Get this wrong and the symptom is nasty and easy to miss in development:
   * hard-load /shop and the nav is invisible forever, because nothing on that
   * page ever flips `introDone`.
   */
  const isHome = pathname === "/";
  const revealed = introDone || !isHome;

  /* NOTE THE DIRECTION OF THIS EFFECT: the markup below renders the nav
     VISIBLE, and the effect hides it only while an intro is actually running.
     Layout effects run before the browser paints, so there is no flash — and
     if JS never runs, the visitor gets a working nav instead of an invisible
     one. Shipping `opacity: 0` in the HTML and relying on JS to undo it is the
     same mistake as `<body class="opacity-0">`. */
  useGSAP(
    () => {
      registerGsap();
      if (!headerRef.current) return;

      if (prefersReducedMotion()) {
        gsap.set(headerRef.current, { y: 0, autoAlpha: 1 });
        return;
      }

      if (revealed) {
        gsap.to(headerRef.current, {
          y: 0,
          autoAlpha: 1,
          duration: 1,
          ease: "hop",
        });
      } else {
        gsap.set(headerRef.current, { y: -80, autoAlpha: 0 });
      }
    },
    { dependencies: [revealed] },
  );

  /* Pop the bag count when something is added. `addPulse` increments on every
     add, so the effect fires even when adding the same line twice. */
  const addPulse = useCartStore((s) => s.addPulse);
  useGSAP(
    () => {
      if (!addPulse || prefersReducedMotion()) return;
      gsap.fromTo(
        ".bag-count",
        { scale: 1 },
        { scale: 1.6, duration: 0.18, yoyo: true, repeat: 1, ease: "power2.out" },
      );
    },
    { dependencies: [addPulse] },
  );

  return (
    <>
      <header
        ref={headerRef}
        /* z-40 keeps it under the preloader (z-100) and the page curtain
           (z-50) but over everything else. */
        className="fixed top-0 left-0 z-40 w-full mix-blend-difference"
      >
        <div className="edge flex items-center justify-between py-5 text-[#ede4dd]">
          <Link
            href="/"
            className="group relative text-xl font-bold tracking-[-0.02em] uppercase"
          >
            {SITE.name}
          </Link>

          <nav className="hidden items-center gap-9 md:flex">
            {NAV_LINKS.map((link) => {
              const active =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className="group flex items-baseline gap-1.5 text-sm font-semibold uppercase tracking-[0.04em]"
                >
                  <span className="font-mono text-[0.62rem] opacity-50">
                    {link.index}
                  </span>
                  {/* The two-label hover swap. */}
                  <span className="relative block h-[1.2em] overflow-hidden">
                    <span className="block transition-transform duration-500 ease-[var(--ease-hop)] group-hover:-translate-y-full">
                      {link.label}
                    </span>
                    <span
                      aria-hidden
                      className="absolute top-full left-0 block transition-transform duration-500 ease-[var(--ease-hop)] group-hover:-translate-y-full"
                    >
                      {link.label}
                    </span>
                  </span>
                  {active && (
                    <span aria-hidden className="h-1 w-1 rounded-full bg-current" />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-5">
            <ThemeSwitcher />
            <Link
              href="/bag"
              className="text-sm font-semibold uppercase tracking-[0.04em]"
            >
              Bag
              <span className="bag-count ml-1 inline-block font-mono tabular-nums">
                [{count}]
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              className="text-sm font-semibold uppercase md:hidden"
            >
              {menuOpen ? "Close" : "Menu"}
            </button>
          </div>
        </div>
      </header>

      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

/**
 * Mobile overlay.
 *
 * Note the pattern: the panel is ALWAYS rendered and toggled with `inert` +
 * a transform, rather than mounted/unmounted. That way the open and close
 * animations are both real (an unmounting element cannot animate out), and
 * `inert` — one attribute — removes it from the tab order and the
 * accessibility tree while it is off-screen, which a plain `translate-y` alone
 * would not do.
 */
function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      id="mobile-menu"
      inert={!open}
      className={cn(
        "fixed inset-0 z-30 flex flex-col justify-center bg-bg transition-transform duration-700 ease-[var(--ease-glide)] md:hidden",
        open ? "translate-y-0" : "-translate-y-full",
      )}
    >
      <nav className="edge flex flex-col gap-2">
        {NAV_LINKS.map((link, i) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={onClose}
            className="flex items-baseline gap-4 text-[clamp(2.5rem,12vw,5rem)] leading-[0.95] font-bold uppercase transition-opacity duration-300 hover:opacity-60"
            style={{
              /* Stagger the entrance with a plain CSS delay — no JS needed
                 for something this simple. */
              transitionDelay: open ? `${i * 40}ms` : "0ms",
            }}
          >
            <span className="font-mono text-sm opacity-40">{link.index}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
