import { create } from "zustand";
import gsap from "gsap";

interface State {
  hasPlayed: boolean;
  masterTimeline: gsap.core.Timeline | null;
  setHasPlayed: () => void;
  setMasterTimeline: (tl: gsap.core.Timeline) => void;
}

export const useMasterPlayed = create<State>((set) => ({
  hasPlayed: false,
  masterTimeline: null,
  setHasPlayed: () => set({ hasPlayed: true }),
  setMasterTimeline: (tl) => set({ masterTimeline: tl }),
}));
