"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useReader } from "@/store/reader";

function scrollProgress() {
  const h = document.documentElement.scrollHeight - window.innerHeight;
  return h > 0 ? window.scrollY / h : 0;
}

/** Subscribe to scroll with a rAF guard; returns cleanup. */
function onScroll(cb: () => void) {
  let raf = 0;
  const handler = () => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      cb();
    });
  };
  window.addEventListener("scroll", handler, { passive: true });
  window.addEventListener("resize", handler);
  cb();
  return () => {
    window.removeEventListener("scroll", handler);
    window.removeEventListener("resize", handler);
    if (raf) cancelAnimationFrame(raf);
  };
}

export function ProgressBar() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      onScroll(() => {
        if (ref.current)
          ref.current.style.width = `${(scrollProgress() * 100).toFixed(2)}%`;
      }),
    [],
  );
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px]">
      <div
        ref={ref}
        className="h-full bg-(--reading-gold) transition-[width] duration-100"
        style={{ width: 0 }}
      />
    </div>
  );
}

function fmtTime(min: number) {
  if (min <= 0) return "Finished";
  if (min < 60) return `${min} min left`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h ${m ? `${m}m ` : ""}left`;
}

export function ReadingStatus({ totalMin }: { totalMin: number }) {
  const pctRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      onScroll(() => {
        const p = scrollProgress();
        if (pctRef.current) pctRef.current.textContent = `${Math.round(p * 100)}%`;
        if (timeRef.current)
          timeRef.current.textContent = fmtTime(Math.round(totalMin * (1 - p)));
      }),
    [totalMin],
  );
  return (
    <div className="chrome fixed bottom-6 left-1/2 z-[55] flex -translate-x-1/2 items-center gap-2 rounded-full border border-(--reading-rule) bg-(--reading-elev) px-4 py-1.5 text-[0.78rem] font-medium text-(--reading-soft) shadow-[0_4px_18px_rgba(0,0,0,0.1)] backdrop-blur">
      <span ref={pctRef} className="font-semibold text-(--reading-gold)">
        0%
      </span>
      <span className="size-[3px] rounded-full bg-(--reading-soft) opacity-50" />
      <span ref={timeRef}>{fmtTime(totalMin)}</span>
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(
    () =>
      onScroll(() => {
        setShow((cur) => {
          const next = window.scrollY > window.innerHeight;
          return next === cur ? cur : next;
        });
      }),
    [],
  );
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      title="Back to top"
      className="chrome fixed bottom-6 right-6 z-[60] flex size-11 items-center justify-center rounded-full border border-(--reading-rule) bg-(--reading-elev) text-(--reading-soft) shadow-[0_4px_18px_rgba(0,0,0,0.1)] backdrop-blur transition-[color,transform] hover:-translate-y-0.5 hover:text-(--reading-fg)"
    >
      <ArrowUp className="size-5" />
    </button>
  );
}

/** Persists reading progress (throttled) and restores scroll on mount. */
export function ProgressTracker({ bookId }: { bookId: string }) {
  const setProgress = useReader((s) => s.setProgress);
  // persisted progress loads from localStorage asynchronously; wait for it,
  // otherwise the saved position reads as 0 and we'd start from the top.
  const hydrated = useReader((s) => s.hydrated);

  useEffect(() => {
    if (!hydrated) return;

    const start = useReader.getState().progress[bookId] ?? 0;
    // hold off persisting until the saved position is restored, so the
    // initial scrollY (0) doesn't overwrite stored progress.
    let restored = start <= 0.001;

    if (!restored) {
      // fonts/images keep shifting the page height for a few frames after
      // hydration; re-apply the target until the layout settles.
      let tries = 0;
      const restore = () => {
        const h = document.documentElement.scrollHeight - window.innerHeight;
        if (h > 0) window.scrollTo(0, start * h);
        if (++tries < 6) requestAnimationFrame(restore);
        else restored = true;
      };
      requestAnimationFrame(restore);
    }

    let last = 0;
    return onScroll(() => {
      if (!restored) return;
      const now = Date.now();
      if (now - last < 400) return;
      last = now;
      setProgress(bookId, scrollProgress());
    });
  }, [bookId, setProgress, hydrated]);

  return null;
}
