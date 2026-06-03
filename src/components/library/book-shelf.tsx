"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { motion } from "motion/react";
import type { BookMeta } from "@/lib/types";
import { BookCard } from "./book-card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BookShelf({ books }: { books: BookMeta[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const f = q.trim().toLowerCase();
    if (!f) return books;
    return books.filter((b) =>
      `${b.title} ${b.author}`.toLowerCase().includes(f),
    );
  }, [q, books]);

  return (
    <main className="mx-auto max-w-[1100px] px-6 pb-24 pt-14">
      <header className="mb-10 flex items-end justify-between gap-4">
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

      <div className="relative mb-10">
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

      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-x-7 gap-y-9">
        {filtered.map((book, i) => (
          <BookCard key={book.id} book={book} index={i} />
        ))}

        {!q && (
          <Dialog>
            <DialogTrigger
              render={
                <button className="flex aspect-2/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--reading-rule) text-sm text-(--reading-soft) transition-colors hover:border-(--reading-gold) hover:bg-(--reading-elev) hover:text-(--reading-gold)">
                  <Plus className="size-7" strokeWidth={1.5} />
                  <span>Add a book</span>
                </button>
              }
            />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a book to your library</DialogTitle>
                <DialogDescription>
                  Two steps to grow the shelf.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm leading-relaxed">
                <ol className="list-decimal space-y-2 pl-5">
                  <li>
                    Drop the book&rsquo;s content JSON into{" "}
                    <code className="rounded bg-(--reading-sel) px-1 py-0.5">
                      src/content/
                    </code>{" "}
                    and its cover into{" "}
                    <code className="rounded bg-(--reading-sel) px-1 py-0.5">
                      public/covers/
                    </code>
                    .
                  </li>
                  <li>
                    Register it in{" "}
                    <code className="rounded bg-(--reading-sel) px-1 py-0.5">
                      src/lib/books.ts
                    </code>{" "}
                    — one line in the <code>CONTENT</code> map.
                  </li>
                </ol>
                <p>It will then appear here automatically.</p>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {q && filtered.length === 0 && (
          <p className="col-span-full py-12 text-center text-(--reading-soft)">
            No books match &ldquo;{q}&rdquo;.
          </p>
        )}
      </div>

      <footer className="mt-14 border-t border-(--reading-rule) pt-5 text-center text-xs text-(--reading-soft)">
        {books.length} book{books.length === 1 ? "" : "s"} · a quiet place to
        read
      </footer>
    </main>
  );
}
