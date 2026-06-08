"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BookOpen,
  CheckCircle2,
  Clock,
  Library,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import type { BookMeta } from "@/lib/types";
import { cn } from "@/lib/utils";
import { fmtDuration, readingMinutes } from "@/lib/reading";
import { useReader } from "@/store/reader";
import { BookCard } from "./book-card";
import { AddBookDialog } from "./add-book-dialog";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Filter = "all" | "reading" | "finished";
type Sort = "added" | "title" | "author" | "progress" | "shortest";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "reading", label: "Reading" },
  { value: "finished", label: "Finished" },
];

const SORTS: { value: Sort; label: string }[] = [
  { value: "added", label: "Recently added" },
  { value: "title", label: "Title (A–Z)" },
  { value: "author", label: "Author (A–Z)" },
  { value: "progress", label: "Progress" },
  { value: "shortest", label: "Shortest read" },
];

// value → label map so the trigger shows the readable label, not the raw value
const SORT_LABELS: Record<Sort, string> = Object.fromEntries(
  SORTS.map((s) => [s.value, s.label]),
) as Record<Sort, string>;

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Library;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-(--reading-rule) bg-(--reading-elev) px-3.5 py-2.5">
      <Icon className="size-4 shrink-0 text-(--reading-gold)" />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-(--reading-fg)">{value}</div>
        <div className="text-[0.66rem] uppercase tracking-[0.12em] text-(--reading-soft)">
          {label}
        </div>
      </div>
    </div>
  );
}

export function BookShelf({ books }: { books: BookMeta[] }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<Sort>("added");

  const progress = useReader((s) => s.progress);
  const hydrated = useReader((s) => s.hydrated);

  const stats = useMemo(() => {
    let reading = 0;
    let finished = 0;
    let totalMin = 0;
    for (const b of books) {
      totalMin += readingMinutes(b.words);
      const p = hydrated ? (progress[b.id] ?? 0) : 0;
      if (p > 0.99) finished++;
      else if (p > 0.001) reading++;
    }
    return { total: books.length, reading, finished, totalMin };
  }, [books, progress, hydrated]);

  const visible = useMemo(() => {
    const f = q.trim().toLowerCase();
    const statusOf = (id: string) => {
      const p = hydrated ? (progress[id] ?? 0) : 0;
      if (p > 0.99) return "finished";
      if (p > 0.001) return "reading";
      return "unread";
    };

    let list = books.filter(
      (b) => !f || `${b.title} ${b.author}`.toLowerCase().includes(f),
    );
    if (filter !== "all") list = list.filter((b) => statusOf(b.id) === filter);

    const sorted = [...list];
    switch (sort) {
      case "title":
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "author":
        sorted.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case "progress":
        sorted.sort(
          (a, b) => (progress[b.id] ?? 0) - (progress[a.id] ?? 0),
        );
        break;
      case "shortest":
        sorted.sort((a, b) => a.words - b.words);
        break;
    }
    return sorted;
  }, [q, filter, sort, books, progress, hydrated]);

  const showAdd = filter === "all" && !q;

  const emptyMessage =
    q
      ? `No books match “${q}”.`
      : filter === "reading"
        ? "Nothing in progress — pick a book and dive in."
        : filter === "finished"
          ? "No finished books yet."
          : null;

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-14">
      <header className="mb-8 flex items-end justify-between gap-4">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-(--reading-soft)">
            My Library
          </p>
          <h1 className="font-serif text-5xl font-medium leading-none tracking-tight">
            Bookshelf
          </h1>
        </motion.div>
        <ThemeToggle />
      </header>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
      >
        <Stat icon={Library} value={stats.total} label="Books" />
        <Stat icon={BookOpen} value={stats.reading} label="Reading" />
        <Stat icon={CheckCircle2} value={stats.finished} label="Finished" />
        <Stat
          icon={Clock}
          value={fmtDuration(stats.totalMin)}
          label="To read"
        />
      </motion.div>

      <div className="relative mb-5">
        <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-(--reading-soft)" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          type="search"
          placeholder="Search by title or author…"
          autoComplete="off"
          className="w-full rounded-xl border border-(--reading-rule) bg-(--reading-elev) py-3 pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-(--reading-soft) focus:border-(--reading-gold)"
        />
      </div>

      <div className="mb-9 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-xl border border-(--reading-rule) bg-(--reading-elev) p-1">
          {FILTERS.map((t) => (
            <button
              key={t.value}
              onClick={() => setFilter(t.value)}
              className={cn(
                "rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === t.value
                  ? "bg-(--reading-sel) text-(--reading-fg) shadow-sm"
                  : "text-(--reading-soft) hover:text-(--reading-fg)",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <Select<Sort>
          value={sort}
          onValueChange={(value) => value && setSort(value)}
          items={SORT_LABELS}
        >
          <SelectTrigger aria-label="Sort books" className="min-w-48">
            <span className="flex items-center gap-2">
              <ArrowUpDown className="size-3.5 text-(--reading-soft)" />
              <SelectValue />
            </span>
          </SelectTrigger>
          <SelectContent align="end">
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div
        layout
        className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-7 gap-y-9"
      >
        <AnimatePresence mode="popLayout">
          {visible.map((book, i) => (
            <BookCard key={book.id} book={book} index={i} />
          ))}
        </AnimatePresence>

        {showAdd && <AddBookDialog />}

        {visible.length === 0 && emptyMessage && (
          <p className="col-span-full py-12 text-center text-(--reading-soft)">
            {emptyMessage}
          </p>
        )}
      </motion.div>

      <footer className="mt-14 border-t border-(--reading-rule) pt-5 text-center text-xs text-(--reading-soft)">
        {books.length} book{books.length === 1 ? "" : "s"} · a quiet place to
        read
      </footer>
    </main>
  );
}
