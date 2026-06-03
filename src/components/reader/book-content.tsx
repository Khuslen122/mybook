"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import type { BookContent as Book } from "@/lib/types";

function BookContentInner({ book }: { book: Book }) {
  let firstBodySeen = false;

  return (
    <article className="reading reading-measure mx-auto max-w-(--reading-measure) px-6 pb-28 pt-20">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="mb-16 flex min-h-[78vh] flex-col items-center justify-center text-center"
      >
        <div className="relative mb-9 aspect-2/3 w-[200px] max-w-[55%] overflow-hidden rounded-md shadow-[0_18px_40px_-12px_rgba(0,0,0,0.4),0_4px_10px_rgba(0,0,0,0.12)]">
          <Image
            src={book.cover}
            alt={`${book.title} cover`}
            fill
            priority
            sizes="200px"
            className="object-cover"
          />
        </div>
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.22em] text-(--reading-soft)">
          {book.author}
        </p>
        <h1 className="font-serif text-[clamp(2.4rem,7vw,3.4rem)] font-medium italic leading-[1.1] tracking-tight">
          {book.title}
        </h1>
        <span className="mt-7 block h-0.5 w-12 bg-(--reading-gold) opacity-70" />
      </motion.header>

      {book.paragraphs.map((p, i) => {
        if (p.t === "center") {
          return (
            <p key={i} className="center">
              {p.c}
            </p>
          );
        }
        if (p.t === "hang") {
          return (
            <p key={i} className="hang">
              {p.c}
            </p>
          );
        }
        const isFirst = !firstBodySeen;
        firstBodySeen = true;
        return (
          <p key={i} className={isFirst ? "body firstpara" : "body"}>
            {p.c}
          </p>
        );
      })}
    </article>
  );
}

export const BookContent = memo(BookContentInner, (a, b) => a.book.id === b.book.id);
