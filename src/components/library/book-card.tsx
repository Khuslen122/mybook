"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import type { BookMeta } from "@/lib/types";
import { useReader } from "@/store/reader";
import { fmtDuration, readingMinutes } from "@/lib/reading";
import { BookActions } from "./book-actions";

export function BookCard({ book, index }: { book: BookMeta; index: number }) {
  const hydrated = useReader((s) => s.hydrated);
  const p = useReader((s) => s.progress[book.id] ?? 0);
  const started = hydrated && p > 0.001;
  const pct = Math.round(p * 100);

  const label = !hydrated
    ? " "
    : !started
      ? "Start reading"
      : p > 0.99
        ? "Finished"
        : `${pct}% · Continue`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.05, 0.4),
        ease: "easeOut",
      }}
      className="group/card relative"
    >
      <BookActions id={book.id} title={book.title} />
      <Link href={`/read/${book.id}`} className="group block">
        <div
          className="relative mb-3 rounded-lg pb-2"
          style={{
            background:
              "linear-gradient(var(--reading-shelf),var(--reading-shelf)) bottom / 100% 0.6rem no-repeat",
          }}
        >
          <motion.div
            whileHover={{ y: -8, rotate: -0.6 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="relative aspect-2/3 overflow-hidden rounded-[6px_8px_8px_6px] shadow-[0_16px_30px_-10px_rgba(0,0,0,0.45),0_3px_8px_rgba(0,0,0,0.18)]"
          >
            {book.cover ? (
              <Image
                src={book.cover}
                alt={`${book.title} cover`}
                fill
                sizes="(max-width: 640px) 45vw, 200px"
                priority={index < 6}
                className="object-cover"
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center bg-linear-to-br from-(--reading-elev) to-(--reading-sel) p-4 text-center">
                <span className="font-serif text-base font-semibold italic leading-tight text-(--reading-fg)">
                  {book.title}
                </span>
                <span className="mt-2 text-[0.7rem] uppercase tracking-wide text-(--reading-soft)">
                  {book.author}
                </span>
              </div>
            )}
            {started && (
              <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.68rem] font-semibold text-white backdrop-blur-sm">
                {pct}%
              </span>
            )}
          </motion.div>
        </div>

        <h3 className="font-serif text-[1.06rem] font-semibold leading-tight text-(--reading-fg)">
          {book.title}
        </h3>
        <div className="mb-2 flex items-center gap-1.5 text-[0.82rem] text-(--reading-soft)">
          <span className="min-w-0 truncate">{book.author}</span>
          <span className="opacity-40">·</span>
          <span className="shrink-0 whitespace-nowrap">
            {fmtDuration(readingMinutes(book.words))}
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-(--reading-rule)">
          <div
            className="h-full rounded-full bg-(--reading-gold) transition-[width] duration-500"
            style={{ width: `${started ? pct : 0}%` }}
          />
        </div>
        <p className="mt-1.5 text-[0.72rem] text-(--reading-soft)">{label}</p>
      </Link>
    </motion.div>
  );
}
