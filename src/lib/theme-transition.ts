import { DARK_THEMES, THEME_ORDER, useReader } from "@/store/reader";
import type { Theme } from "@/lib/types";

type DocWithVT = Document & {
  startViewTransition?: (cb: () => void) => unknown;
};

/**
 * Switch theme with a smooth full-page crossfade via the View Transitions API,
 * falling back to an instant change when unsupported or reduced-motion is set.
 */
export function setThemeAnimated(theme: Theme) {
  const apply = () => {
    const d = document.documentElement;
    // apply synchronously so the View Transition captures the new colors;
    // the store update below keeps everything else (effects, persistence) in sync
    d.setAttribute("data-theme", theme);
    d.classList.toggle("dark", DARK_THEMES.includes(theme));
    useReader.getState().setSettings({ theme });
  };

  const reduce = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const doc = document as DocWithVT;

  if (!reduce && typeof doc.startViewTransition === "function") {
    doc.startViewTransition(apply);
  } else {
    apply();
  }
}

/** Advance to the next theme in the picker order, animated. */
export function cycleThemeAnimated() {
  const cur = useReader.getState().settings.theme;
  const next = THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length];
  setThemeAnimated(next);
}
