"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import SplitText from "gsap/src/SplitText";
import { useEffect, useRef } from "react";
import { useMasterPlayed } from "@/store/ani.store";
import fitty from "fitty";

gsap.registerPlugin(SplitText);

const Hero = () => {
  const ref = useRef<HTMLDivElement>(null);

  const { masterTimeline, hasPlayed } = useMasterPlayed();

  useGSAP(
    () => {
      const st = SplitText.create(".main-heading", {
        type: "chars",
        mask: "chars",
      });

      if (!hasPlayed && masterTimeline) {
        masterTimeline
          .from(
            st.chars,
            {
              yPercent: 100,
              ease: "power1.inOut",
              stagger: { amount: 0.5, from: "random" },
            },
            "-=0.55",
          )
          .from(
            ".bar",
            {
              scaleX: 0,
              ease: "power1.inOut",
            },
            "<0.3",
          )
          .from(
            ".bottom-heading",
            { yPercent: 100, opacity: 0, ease: "power1.inOut", stagger: 0.1 },
            "<0.1",
          );
      } else if (hasPlayed) {
        const heroTimeline = gsap.timeline();
        heroTimeline
          .from(st.chars, {
            yPercent: 100,
            ease: "power1.inOut",
            stagger: { amount: 0.5, from: "random" },
          })
          .from(
            ".bar",
            {
              scaleX: 0,
              ease: "power1.inOut",
            },
            "<0.3",
          )
          .from(
            ".bottom-heading",
            { yPercent: 100, opacity: 0, ease: "power1.inOut", stagger: 0.1 },
            "<0.2",
          );
      }
    },
    { scope: ref, dependencies: [masterTimeline] },
  );
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (titleRef.current) fitty(titleRef.current);
  }, []);

  return (
    <>
      <div ref={ref} className="h-screen w-full p-6 relative ">
        <div className="w-full">
          <h1
            ref={titleRef}
            className="main-heading pt-18 font-bold uppercase leading-[0.78]"
          >
            Outfit
          </h1>
        </div>
        <div className="w-full bar origin-left h-[6px] red:bg-[#ff0001] dark:bg-white blue:bg-[#0040ff] my-3" />
        <div className="grid grid-cols-4 py-5 font-semibold">
          <div className="">outfit</div>
          <div className="flex flex-col gap-6 max-w-[60ch] col-[2/4]">
            <p>why</p>
            <p>
              Created by the ++hellohello team, this store and signature
              collection celebrates our collective creativity and passion for
              apparel. Carefully designed.
            </p>
          </div>
          <div>outfit</div>
        </div>
      </div>
      <div className="h-screen"></div>
    </>
  );
};

export default Hero;
