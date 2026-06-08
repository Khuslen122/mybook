"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { BookContent as Book } from "@/lib/types";
import { useReader } from "@/store/reader";
import { cycleThemeAnimated } from "@/lib/theme-transition";
import { BookContent } from "./book-content";
import { SettingsPanel } from "./settings-panel";
import {
  BackToTop,
  ProgressBar,
  ProgressTracker,
  ReadingStatus,
} from "./scroll-ui";
import { addBookmarkHere } from "./use-bookmarks";

const WPM = 230;

export function Reader({ book }: { book: Book }) {
  const [open, setOpen] = useState(false);
  const openRef = useRef(open);
  openRef.current = open;

  const totalMin = useMemo(() => {
    const words = book.paragraphs.reduce(
      (n, p) => n + p.c.split(/\s+/).filter(Boolean).length,
      0,
    );
    return Math.max(1, Math.round(words / WPM));
  }, [book]);

  // keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const step = window.innerHeight * 0.9;
      const { settings, setSettings } = useReader.getState();
      switch (e.key) {
        case " ":
        case "PageDown":
          e.preventDefault();
          window.scrollBy({ top: step, behavior: "smooth" });
          break;
        case "PageUp":
          e.preventDefault();
          window.scrollBy({ top: -step, behavior: "smooth" });
          break;
        case "ArrowDown":
        case "j":
          window.scrollBy({ top: 120, behavior: "smooth" });
          break;
        case "ArrowUp":
        case "k":
          window.scrollBy({ top: -120, behavior: "smooth" });
          break;
        case "Home":
        case "g":
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: "smooth" });
          break;
        case "End":
        case "G":
          e.preventDefault();
          window.scrollTo({
            top: document.body.scrollHeight,
            behavior: "smooth",
          });
          break;
        case "+":
        case "=":
          setSettings({ size: Math.min(1.8, settings.size + 0.07) });
          break;
        case "-":
        case "_":
          setSettings({ size: Math.max(0.95, settings.size - 0.07) });
          break;
        case "t":
        case "T":
          cycleThemeAnimated();
          break;
        case "b":
        case "B":
          addBookmarkHere(book.id);
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [book.id]);

  // auto-hide chrome when idle
  useEffect(() => {
    let timer: number;
    const show = () => {
      document.body.classList.remove("chrome-hidden");
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (window.scrollY > window.innerHeight && !openRef.current) {
          document.body.classList.add("chrome-hidden");
        }
      }, 2800);
    };
    const events = ["mousemove", "scroll", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, show, { passive: true }));
    show();
    return () => {
      events.forEach((e) => window.removeEventListener(e, show));
      clearTimeout(timer);
      document.body.classList.remove("chrome-hidden");
    };
  }, []);

  return (
    <main>
      <ProgressBar />
      <ProgressTracker bookId={book.id} />

      <Button
        variant="outline"
        size="icon"
        nativeButton={false}
        className="chrome fixed left-4 top-4 z-[60] rounded-full shadow-[0_4px_18px_rgba(0,0,0,0.1)] backdrop-blur"
        render={
          <Link href="/" aria-label="Back to library" title="Back to library">
            <ArrowLeft className="size-5" />
          </Link>
        }
      />

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              aria-label="Reading settings"
              title="Reading settings"
              className="chrome fixed right-4 top-4 z-[60] rounded-full shadow-[0_4px_18px_rgba(0,0,0,0.1)] backdrop-blur"
            >
              <Settings2 className="size-5" />
            </Button>
          }
        />
        <PopoverContent
          align="end"
          sideOffset={10}
          positionMethod="fixed"
          className="max-h-[85vh] w-auto overflow-y-auto"
        >
          <SettingsPanel bookId={book.id} />
        </PopoverContent>
      </Popover>

      <BookContent book={book} />

      <ReadingStatus totalMin={totalMin} />
      <BackToTop />
    </main>
  );
}
