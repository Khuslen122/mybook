"use client";

import { useEffect } from "react";
import { useReader } from "@/store/reader";

/** Applies reading settings to <html> so CSS variables update live. */
export function ThemeEffect() {
  const { theme, font, size, leading, measure, align } = useReader(
    (s) => s.settings,
  );

  useEffect(() => {
    const d = document.documentElement;
    d.setAttribute("data-theme", theme);
    d.setAttribute("data-font", font);
    d.setAttribute("data-align", align);
    d.classList.toggle("dark", theme === "dark");
    d.style.setProperty("--reading-size", `${size}rem`);
    d.style.setProperty("--reading-leading", String(leading));
    d.style.setProperty("--reading-measure", measure);
  }, [theme, font, size, leading, measure, align]);

  return null;
}
