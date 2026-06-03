import type { BookContent, BookMeta } from "./types";
import norwegianWood from "@/content/norwegian-wood.json";

/** Registry of all installed books. Add a new entry + JSON file to grow the library. */
const CONTENT: Record<string, BookContent> = {
  "norwegian-wood": norwegianWood as BookContent,
};

function countWords(book: BookContent): number {
  return book.paragraphs.reduce(
    (n, p) => n + p.c.split(/\s+/).filter(Boolean).length,
    0,
  );
}

export function getAllBooks(): BookMeta[] {
  return Object.values(CONTENT).map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.cover,
    year: b.year,
    words: countWords(b),
  }));
}

export function getBook(id: string): BookContent | null {
  return CONTENT[id] ?? null;
}
