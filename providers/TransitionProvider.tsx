"use client";

import { TransitionRouter } from "next-transition-router";
import { gsap } from "gsap";
import { useRef, startTransition } from "react";

export default function TransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={overlayRef}
        className="fixed inset-0 z-50 red:bg-[#ff0001] dark:bg-white blue:bg-[#0040ff] pointer-events-none will-change-transform"
        style={{ transform: "scaleY(0)", transformOrigin: "bottom" }}
      />

      <TransitionRouter
        auto
        leave={(next) => {
          const overlay = overlayRef.current;
          const page = pageRef.current;
          if (!overlay || !page) return next();

          const tl = gsap.timeline({
            onComplete: () => {
              requestAnimationFrame(() => startTransition(next));
            },
          });

          tl.to(page, {
            scale: 0.6,
            duration: 0.5,
            ease: "power2.inOut",
          }).to(
            overlay,
            {
              scaleY: 1,
              duration: 0.5,
              ease: "power2.inOut",
            },
            "<",
          );

          gsap.set(overlay, { transformOrigin: "bottom" });

          return () => tl.kill();
        }}
        enter={(next) => {
          const overlay = overlayRef.current;
          const page = pageRef.current;
          if (!overlay || !page) return next();

          const tl = gsap.timeline({ onComplete: next });

          gsap.set(overlay, { transformOrigin: "top" });
          gsap.set(page, { scale: 2 });

          tl.to(overlay, {
            scaleY: 0,
            duration: 0.5,
            ease: "power2.inOut",
          }).to(
            page,
            {
              scale: 1,
              duration: 0.5,
              ease: "power2.out",
            },
            "<",
          );

          return () => tl.kill();
        }}
      >
        <div
          ref={pageRef}
          className="will-change-transform min-h-screen origin-top"
        >
          {children}
        </div>
      </TransitionRouter>
    </>
  );
}
