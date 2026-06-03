"use client";

import { toast } from "sonner";
import { useReader } from "@/store/reader";
import type { Bookmark } from "@/lib/types";

function snippetAt(viewportY: number): string {
  const el = document
    .elementFromPoint(window.innerWidth / 2, viewportY)
    ?.closest("p");
  const t = (el?.textContent ?? "").replace(/\s+/g, " ").trim();
  return t ? t.slice(0, 42) + (t.length > 42 ? "…" : "") : "Bookmark";
}

/** Add a bookmark at the current scroll position (used by button + keyboard). */
export function addBookmarkHere(bookId: string) {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const y = window.scrollY;
  const p = h > 0 ? y / h : 0;
  const existing = useReader.getState().bookmarks[bookId] ?? [];
  if (existing.some((b) => Math.abs(b.y - y) < 40)) {
    toast("Already bookmarked here");
    return;
  }
  const bm: Bookmark = { id: Date.now(), y, p, label: snippetAt(120) };
  useReader.getState().addBookmark(bookId, bm);
  toast("Bookmarked");
}

export function jumpTo(p: number) {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  window.scrollTo({ top: p * h, behavior: "smooth" });
}
