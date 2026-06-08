"use client";

import { Cloud, Moon, MoonStar, Sun, SunMedium, Trees } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useReader } from "@/store/reader";
import { cycleThemeAnimated } from "@/lib/theme-transition";
import type { Theme } from "@/lib/types";

const ICON: Record<Theme, typeof Sun> = {
  light: Sun,
  sepia: SunMedium,
  gray: Cloud,
  dark: Moon,
  night: MoonStar,
  forest: Trees,
};

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useReader((s) => s.settings.theme);
  const Icon = ICON[theme];

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={cycleThemeAnimated}
      aria-label={`Theme: ${theme}. Click to change.`}
      title={`Theme: ${theme}`}
      className={`rounded-full ${className ?? ""}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, opacity: 0, scale: 0.6 }}
          animate={{ rotate: 0, opacity: 1, scale: 1 }}
          exit={{ rotate: 90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          <Icon className="size-[1.15rem]" />
        </motion.span>
      </AnimatePresence>
    </Button>
  );
}
