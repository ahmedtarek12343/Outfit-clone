/**
 * A module-scoped handle on the single Lenis instance.
 *
 * Why not React context? Because the consumers are imperative animation
 * callbacks (a page-transition `leave` handler, a modal open) that run outside
 * React's render cycle. Threading a context through to them buys nothing and
 * forces those callbacks to become hooks. A module singleton is the honest
 * shape for a genuinely global, single-instance browser resource — and it is
 * still tree-shakeable and typed, unlike hanging it off `window`.
 */
import type Lenis from "lenis";

let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;

/** Jump to the top with no animation. Used between page transitions. */
export function resetScroll() {
  if (instance) {
    // `immediate` skips the eased tween; `force` works even while stopped.
    instance.scrollTo(0, { immediate: true, force: true });
  }
  // Belt and braces for the case where Lenis has not booted yet.
  window.scrollTo(0, 0);
}
