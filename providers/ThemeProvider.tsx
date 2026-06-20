"use client";
import React, { useEffect } from "react";
import { useThemeStore } from "@/store/theme.store";

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return <>{children}</>;
};

export default ThemeProvider;
