"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import CustomEase from "gsap/src/CustomEase";
import SplitText from "gsap/src/SplitText";
import { useRef } from "react";
import { useMasterPlayed } from "@/store/ani.store";
import Image from "next/image";

CustomEase.create("hop", "0.9,0,0.1,1");
CustomEase.create("glide", "0.8,0,0.2,1");

const Preloader = () => {
  // Grab `hasPlayed` state instead of the timeline
  const { hasPlayed, masterTimeline, setHasPlayed } = useMasterPlayed();
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // If it's already played or the timeline isn't ready, do nothing
      if (hasPlayed || !masterTimeline) return;

      gsap.set(".img-wrapper", {
        rotation: "random(-15,15)",
        transformOrigin: "center",
      });

      const counter = { value: 0 };
      const num = containerRef.current?.querySelector(".number");

      const st = SplitText.create(".main-text", {
        type: "chars",
        mask: "chars",
      });

      gsap.set(".img-wrapper", { scale: 0 });

      // ... KEEP YOUR EXACT SAME INTRO ANIMATIONS ...
      const preloaderTimeline = gsap.timeline({
        onComplete: () => {
          setHasPlayed();
        },
      });
      preloaderTimeline
        .to(".img-wrapper", {
          scale: 1,
          ease: "power1.inOut",
          stagger: { each: 0.2 },
        })
        .from(
          st.chars,
          {
            yPercent: 100,
            ease: "power1.inOut",
            stagger: { amount: 1.25, from: "random" },
          },
          "<",
        );

      preloaderTimeline.to(
        counter,
        {
          value: 100,
          onUpdate: () => {
            if (num)
              num.textContent = `${Math.floor(counter.value)}`.padStart(3, "0");
          },
          duration: 3,
          ease: "power2.inOut",
        },
        0,
      );

      // EXIT ANIMATION
      preloaderTimeline
        .to(".img-wrapper", {
          scale: 0,
          ease: "power2.inOut",
          stagger: { each: 0.1, from: "end" },
        })
        .to(".number", { y: -30, autoAlpha: 0 }, "<")
        .to(
          st.chars,
          {
            yPercent: -100,
            ease: "power2.inOut",
            stagger: { each: 0.1, from: "random" },
          },
          "<0.15",
        )
        .to(
          containerRef.current,
          {
            clipPath: "inset(0 0 100% 0)",
            duration: 0.75,
            ease: "glide",
          },
          "<0.5",
        );
      if (!hasPlayed && masterTimeline) masterTimeline.add(preloaderTimeline);
    },
    { scope: containerRef, dependencies: [masterTimeline, hasPlayed] },
  );

  // If we navigate away and back, unmount the preloader completely
  if (hasPlayed) return null;

  return (
    <div
      ref={containerRef}
      className="preloader z-50 h-screen bg-black text-white fixed top-0 w-full"
    >
      {/* ... keep all your existing mapped images and JSX inside here ... */}
      {Array.from({ length: 6 }).map((item, index) => {
        return (
          <div
            key={index}
            className="img-wrapper w-60 h-80 will-change-transform absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Image
              src={`/image-0${index + 1}.avif`}
              alt=""
              width={500}
              height={500}
              className="w-full h-full object-cover"
            />
          </div>
        );
      })}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-container mix-blend-difference">
        <h1 className="main-text leading-[0.8] whitespace-nowrap text-[clamp(6rem,12vw,10rem)] font-bold uppercase">
          Outfit
        </h1>
        <div className="number absolute -top-25 -right-20 -translate-x-1/2 text-5xl text-white">
          000
        </div>
      </div>
    </div>
  );
};

export default Preloader;
