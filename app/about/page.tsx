"use client";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTransitionState } from "next-transition-router";

const AboutPage = () => {
  // Destructure 'stage' instead of 'isReady'
  const { stage } = useTransitionState();

  useGSAP(() => {
    gsap.from(".about-text", {
      y: 80,
      autoAlpha: 0,
      ease: "power2.inOut",
      duration: 0.6,
    });
  });

  return (
    <>
      <div className="about-text h-screen w-full flex justify-center items-center text-5xl">
        AboutPage
      </div>
      <div className="h-screen"></div>
    </>
  );
};

export default AboutPage;
