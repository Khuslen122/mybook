"use client";

import type { ReactNode } from "react";
import {
  Bookmark as BookmarkIcon,
  Check,
  ChevronDown,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { useReader } from "@/store/reader";
import { setThemeAnimated } from "@/lib/theme-transition";
import { addBookmarkHere, jumpTo } from "./use-bookmarks";
import type { Align, Bookmark, FontFamily, Theme } from "@/lib/types";

// Stable reference so the selector doesn't return a fresh [] every render
// (which would trip Zustand's "getSnapshot should be cached" infinite loop).
const NO_BOOKMARKS: Bookmark[] = [];

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <span className="block text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--reading-soft)">
        {label}
      </span>
      {children}
    </div>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode }[];
}) {
  return (
    <div className="flex gap-1 rounded-[10px] border border-(--reading-rule) bg-(--reading-bg) p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-[0.82rem] font-medium leading-none transition-colors",
            value === o.value
              ? "bg-(--reading-elev) text-(--reading-gold) shadow-sm"
              : "text-(--reading-soft) hover:text-(--reading-fg)",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

const THEMES: { value: Theme; label: string; swatch: string }[] = [
  { value: "light", label: "Light", swatch: "#faf8f3" },
  { value: "sepia", label: "Sepia", swatch: "#f4ecd8" },
  { value: "gray", label: "Gray", swatch: "#ececed" },
  { value: "dark", label: "Dark", swatch: "#1d1c19" },
  { value: "night", label: "Night", swatch: "#161d2c" },
  { value: "forest", label: "Forest", swatch: "#161d14" },
];

const SHORTCUTS: { keys: string[]; desc: string }[] = [
  { keys: ["J", "K"], desc: "Scroll line" },
  { keys: ["Space"], desc: "Page down" },
  { keys: ["+", "−"], desc: "Text size" },
  { keys: ["T"], desc: "Cycle theme" },
  { keys: ["B"], desc: "Bookmark" },
  { keys: ["G", "⇧G"], desc: "Top / end" },
];

export function SettingsPanel({ bookId }: { bookId: string }) {
  const settings = useReader((s) => s.settings);
  const setSettings = useReader((s) => s.setSettings);
  const resetSettings = useReader((s) => s.resetSettings);
  const bookmarks = useReader((s) => s.bookmarks[bookId] ?? NO_BOOKMARKS);
  const removeBookmark = useReader((s) => s.removeBookmark);

  const sizePct = Math.round((settings.size / 1.28) * 100);

  return (
    <div className="w-72 space-y-4">
      <Group label="Theme">
        <div className="grid grid-cols-3 gap-2">
          {THEMES.map((t) => {
            const active = settings.theme === t.value;
            return (
              <button
                key={t.value}
                onClick={() => setThemeAnimated(t.value)}
                aria-label={`${t.label} theme`}
                aria-pressed={active}
                className="flex flex-col items-center gap-1.5 transition-transform hover:-translate-y-0.5"
              >
                <span
                  style={{ background: t.swatch }}
                  className={cn(
                    "flex h-8 w-full items-center justify-center rounded-lg border-2 transition-colors",
                    active
                      ? "border-(--reading-gold)"
                      : "border-(--reading-rule)",
                  )}
                >
                  {active && <Check className="size-4 text-(--reading-gold)" />}
                </span>
                <span
                  className={cn(
                    "text-[0.7rem] font-medium leading-none transition-colors",
                    active ? "text-(--reading-gold)" : "text-(--reading-soft)",
                  )}
                >
                  {t.label}
                </span>
              </button>
            );
          })}
        </div>
      </Group>

      <Group label="Font">
        <Segmented<FontFamily>
          value={settings.font}
          onChange={(font) => setSettings({ font })}
          options={[
            { value: "serif", label: <span className="font-serif">Serif</span> },
            { value: "sans", label: <span className="font-sans">Sans</span> },
            { value: "mono", label: <span className="font-mono">Mono</span> },
          ]}
        />
      </Group>

      <Group label={`Text size · ${sizePct}%`}>
        <Slider
          value={[settings.size]}
          min={0.95}
          max={1.8}
          step={0.01}
          onValueChange={(v) =>
            setSettings({ size: Array.isArray(v) ? v[0] : v })
          }
        />
      </Group>

      <Group label="Line spacing">
        <Segmented<string>
          value={String(settings.leading)}
          onChange={(v) => setSettings({ leading: parseFloat(v) })}
          options={[
            { value: "1.55", label: "Tight" },
            { value: "1.8", label: "Normal" },
            { value: "2.1", label: "Airy" },
          ]}
        />
      </Group>

      <Group label="Paragraph spacing">
        <Segmented<string>
          value={String(settings.paraGap)}
          onChange={(v) => setSettings({ paraGap: parseFloat(v) })}
          options={[
            { value: "0.8", label: "Compact" },
            { value: "1.35", label: "Normal" },
            { value: "2", label: "Roomy" },
          ]}
        />
      </Group>

      <Group label="Page width">
        <Segmented<string>
          value={settings.measure}
          onChange={(measure) => setSettings({ measure })}
          options={[
            { value: "32rem", label: "Narrow" },
            { value: "40rem", label: "Normal" },
            { value: "52rem", label: "Wide" },
          ]}
        />
      </Group>

      <Group label="Alignment">
        <Segmented<Align>
          value={settings.align}
          onChange={(align) => setSettings({ align })}
          options={[
            { value: "left", label: "Left" },
            { value: "justify", label: "Justify" },
          ]}
        />
      </Group>

      <Separator />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--reading-soft)">
            Bookmarks
          </span>
          <button
            onClick={() => addBookmarkHere(bookId)}
            className="flex items-center gap-1 rounded-full border border-(--reading-rule) px-2 py-0.5 text-[0.68rem] font-semibold text-(--reading-soft) transition-colors hover:border-(--reading-gold) hover:text-(--reading-gold)"
          >
            <Plus className="size-3" /> Add
          </button>
        </div>

        {bookmarks.length === 0 ? (
          <p className="py-1 text-[0.74rem] text-(--reading-soft) opacity-80">
            No bookmarks yet
          </p>
        ) : (
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {[...bookmarks]
              .sort((a, b) => a.y - b.y)
              .map((bm) => (
                <li key={bm.id} className="flex items-stretch gap-1">
                  <button
                    onClick={() => jumpTo(bm.p)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-(--reading-bg) px-2 py-1.5 text-left transition-colors hover:bg-(--reading-sel)"
                  >
                    <BookmarkIcon className="size-3 shrink-0 text-(--reading-gold)" />
                    <span className="w-8 shrink-0 text-[0.68rem] font-bold text-(--reading-gold)">
                      {Math.round(bm.p * 100)}%
                    </span>
                    <span className="truncate text-[0.74rem] text-(--reading-fg)">
                      {bm.label}
                    </span>
                  </button>
                  <button
                    onClick={() => removeBookmark(bookId, bm.id)}
                    aria-label="Remove bookmark"
                    className="flex w-7 shrink-0 items-center justify-center rounded-lg bg-(--reading-bg) text-(--reading-soft) transition-colors hover:bg-(--reading-sel) hover:text-red-500"
                  >
                    <X className="size-3.5" />
                  </button>
                </li>
              ))}
          </ul>
        )}
      </div>

      <Separator />

      <details className="group">
        <summary className="flex cursor-pointer list-none items-center justify-between text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-(--reading-soft) [&::-webkit-details-marker]:hidden">
          Shortcuts
          <ChevronDown className="size-3.5 transition-transform group-open:rotate-180" />
        </summary>
        <dl className="mt-2.5 space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.desc}
              className="flex items-center justify-between gap-2"
            >
              <dt className="text-[0.74rem] text-(--reading-soft)">{s.desc}</dt>
              <dd className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd
                    key={k}
                    className="rounded border border-(--reading-rule) bg-(--reading-bg) px-1.5 py-0.5 font-mono text-[0.66rem] font-medium leading-none text-(--reading-fg)"
                  >
                    {k}
                  </kbd>
                ))}
              </dd>
            </div>
          ))}
        </dl>
      </details>

      <Separator />

      <button
        onClick={resetSettings}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[0.74rem] font-medium text-(--reading-soft) transition-colors hover:text-(--reading-fg)"
      >
        <RotateCcw className="size-3.5" />
        Reset to defaults
      </button>
    </div>
  );
}
