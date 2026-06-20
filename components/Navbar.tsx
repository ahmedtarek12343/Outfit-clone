"use client";
import Link from "next/link";
import { useMasterPlayed } from "@/store/ani.store";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useThemeStore } from "@/store/theme.store";

const Navbar = () => {
  const { setTheme } = useThemeStore();
  const { hasPlayed } = useMasterPlayed();
  useGSAP(() => {
    gsap.set(".navbar", {
      y: -90,
      opacity: 0,
    });
    if (hasPlayed) {
      gsap.to(".navbar", {
        y: 0,
        ease: "back",
        opacity: 1,
      });
    }
  }, [hasPlayed]);
  return (
    <header className="fixed mix-blend-difference bg-transparent red:text-[#00ffff] dark:text-white blue:text-[#ffd900] z-10 navbar top-0 left-0 h-16 w-full px-10 pt-5 flex justify-between items-center">
      <div className="logo text-2xl font-bold">Logo</div>
      <nav className="flex items-center gap-10 text-md">
        <Link
          href="/"
          className="text-2xl font-bold hover:opacity-70 transition-opacity duration-300 ease-in-out"
        >
          Home
        </Link>
        <Link
          href="/about"
          className="text-2xl font-bold hover:opacity-70 transition-opacity duration-300 ease-in-out"
        >
          About
        </Link>
        <Link
          href="/shop"
          className="text-2xl font-bold hover:opacity-70 transition-opacity duration-300 ease-in-out"
        >
          Shop
        </Link>
        <div className="theme-wrapper">
          <div className="theme-toggle flex gap-2 items-center">
            <div
              onClick={() => {
                gsap.from("body", {
                  opacity: 0,
                  duration: 0.5,
                  ease: "power2.out",
                });
                setTheme("red");
              }}
              className="w-5 h-5 rounded-full bg-[#00ffff] hover:scale-110 transition-all duration-300 ease-in-out cursor-pointer"
            ></div>
            <div
              onClick={() => {
                gsap.from("body", {
                  opacity: 0,
                  duration: 0.5,
                  ease: "power2.out",
                });
                setTheme("dark");
              }}
              className="w-5 h-5 rounded-full bg-[#ede4dd] hover:scale-110 transition-all duration-300 ease-in-out cursor-pointer"
            ></div>
            <div
              onClick={() => {
                gsap.from("body", {
                  opacity: 0,
                  duration: 0.5,
                  ease: "power2.out",
                });
                setTheme("blue");
              }}
              className="w-5 h-5 rounded-full bg-[#ffd900] hover:scale-110 transition-all duration-300 ease-in-out cursor-pointer"
            ></div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
