"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Align, Bookmark, FontFamily, Theme } from "@/lib/types";

export type Settings = {
  theme: Theme;
  font: FontFamily;
  /** base reading font-size in rem */
  size: number;
  /** line-height multiplier */
  leading: number;
  /** column max-width, a CSS length */
  measure: string;
  align: Align;
};

type ReaderState = {
  settings: Settings;
  progress: Record<string, number>;
  bookmarks: Record<string, Bookmark[]>;
  hydrated: boolean;

  setSettings: (patch: Partial<Settings>) => void;
  cycleTheme: () => void;
  setProgress: (bookId: string, p: number) => void;
  addBookmark: (bookId: string, bm: Bookmark) => void;
  removeBookmark: (bookId: string, id: number) => void;
  setHydrated: () => void;
};

export const DEFAULT_SETTINGS: Settings = {
  theme: "light",
  font: "serif",
  size: 1.28,
  leading: 1.8,
  measure: "40rem",
  align: "left",
};

const THEME_ORDER: Theme[] = ["light", "sepia", "dark"];

export const useReader = create<ReaderState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_SETTINGS },
      progress: {},
      bookmarks: {},
      hydrated: false,

      setSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),

      cycleTheme: () => {
        const cur = get().settings.theme;
        const next = THEME_ORDER[(THEME_ORDER.indexOf(cur) + 1) % THEME_ORDER.length];
        set((s) => ({ settings: { ...s.settings, theme: next } }));
      },

      setProgress: (bookId, p) =>
        set((s) => ({ progress: { ...s.progress, [bookId]: p } })),

      addBookmark: (bookId, bm) =>
        set((s) => ({
          bookmarks: {
            ...s.bookmarks,
            [bookId]: [...(s.bookmarks[bookId] ?? []), bm],
          },
        })),

      removeBookmark: (bookId, id) =>
        set((s) => ({
          bookmarks: {
            ...s.bookmarks,
            [bookId]: (s.bookmarks[bookId] ?? []).filter((b) => b.id !== id),
          },
        })),

      setHydrated: () => set({ hydrated: true }),
    }),
    {
      name: "nw-reader",
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);
