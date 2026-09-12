/**
 * Intro-sequence store.
 *
 * THE PROBLEM THIS SOLVES
 * A preloader must play exactly once — on the first hard load — and then never
 * again, including when the visitor navigates Home → Shop → Home. But the hero
 * animation needs to know which case it is in:
 *
 *   first load      : hero reveal is APPENDED to the preloader's timeline, so
 *                     the wordmark starts rising while the curtain is still
 *                     lifting. That overlap is what makes an intro feel
 *                     choreographed rather than sequential.
 *   later visits    : hero plays its own short standalone timeline.
 *
 * So we keep two things in module state (NOT React state, because it must
 * survive route changes without a provider re-mounting):
 *
 *   introDone      : has the preloader finished at least once?
 *   masterTimeline : the shared timeline the preloader and hero both write to.
 *
 * Holding a GSAP timeline in a store is unusual and worth a caveat: it is a
 * mutable object, so it must never be part of a render-diffing path. We only
 * ever read it inside effects/useGSAP, never in JSX.
 */
import { create } from "zustand";
import type gsap from "gsap";

interface IntroState {
  introDone: boolean;
  /** Set true when the preloader's exit finishes (or immediately if skipped). */
  finishIntro: () => void;

  masterTimeline: gsap.core.Timeline | null;
  setMasterTimeline: (tl: gsap.core.Timeline) => void;

  /** Lenis is stopped during the preloader; the hero re-enables it. */
  scrollLocked: boolean;
  setScrollLocked: (locked: boolean) => void;
}

/**
 * ⚠ THE INITIAL STATE MUST BE IDENTICAL ON SERVER AND CLIENT
 *
 * It is tempting to seed this from the entry URL —
 * `introDone: window.location.pathname !== "/"` — so that a hard load of
 * /shop skips the intro. Do not. `window` does not exist during SSR, so the
 * server would compute `introDone: true` (Preloader renders `null`) while the
 * client computes `false` (Preloader renders a full-screen panel). React sees
 * two different trees and throws a hydration error (#418), then discards the
 * server HTML and re-renders the whole subtree on the client — which is both a
 * visible flash and the opposite of what you wanted.
 *
 * So: plain, deterministic defaults here, and the two route-dependent
 * questions are answered by the components that can actually answer them:
 *
 *   "should the nav hide for an intro?"  → Navbar, via usePathname()
 *   "should scrolling be locked?"        → Preloader, on mount
 *
 * `scrollLocked` defaults to FALSE for the same reason the body is not
 * rendered at `opacity: 0`: the safe default must be the working page. Only a
 * preloader that actually mounted is allowed to take scrolling away.
 */
export const useIntroStore = create<IntroState>((set) => ({
  introDone: false,
  finishIntro: () => set({ introDone: true, scrollLocked: false }),

  masterTimeline: null,
  setMasterTimeline: (tl) => set({ masterTimeline: tl }),

  scrollLocked: false,
  setScrollLocked: (scrollLocked) => set({ scrollLocked }),
}));
