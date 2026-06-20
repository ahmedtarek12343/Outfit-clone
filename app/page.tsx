"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import Hero from "@/components/Hero";
import { useMasterPlayed } from "@/store/ani.store";
import Preloader from "@/components/Preloader";

const App = () => {
  // Make sure your Zustand store exports hasPlayed and setHasPlayed!
  const { hasPlayed, setMasterTimeline } = useMasterPlayed();

  useGSAP(() => {
    // Only generate the master timeline on the initial hard load
    if (!hasPlayed) {
      const tl = gsap.timeline();
      setMasterTimeline(tl);
    }
  }, [hasPlayed]);

  return (
    <>
      <Preloader />
      <Hero />
    </>
  );
};

export default App;
