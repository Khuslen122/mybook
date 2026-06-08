import { promises as fs } from "node:fs";
import path from "node:path";
import type { BookContent, BookMeta, Para } from "./types";
import seedNorwegianWood from "@/content/norwegian-wood.json";

// On-disk store. Book content lives as one JSON file per book in `data/books/`;
// cover images are served statically from `public/covers/`.
const DATA_DIR = path.join(process.cwd(), "data", "books");
const COVERS_DIR = path.join(process.cwd(), "public", "covers");

const SEED: BookContent[] = [seedNorwegianWood as BookContent];

/** Create the data dir on first use and seed it with the bundled book(s). */
async function ensureStore(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
    return; // already initialised — never re-seed
  } catch {
    // not created yet
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await Promise.all(
    SEED.map((b) =>
      fs.writeFile(bookPath(b.id), JSON.stringify(b, null, 2), "utf8"),
    ),
  );
}

function bookPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

function countWords(book: BookContent): number {
  return book.paragraphs.reduce(
    (n, p) => n + p.c.split(/\s+/).filter(Boolean).length,
    0,
  );
}

function toMeta(b: BookContent): BookMeta {
  return {
    id: b.id,
    title: b.title,
    author: b.author,
    cover: b.cover,
    year: b.year,
    words: countWords(b),
  };
}

async function readBook(id: string): Promise<BookContent | null> {
  try {
    const raw = await fs.readFile(bookPath(id), "utf8");
    return JSON.parse(raw) as BookContent;
  } catch {
    return null;
  }
}

export async function getAllBooks(): Promise<BookMeta[]> {
  await ensureStore();
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const books = await Promise.all(
    files.map((f) => readBook(path.basename(f, ".json"))),
  );
  return books
    .filter((b): b is BookContent => b !== null)
    .map(toMeta)
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function getBook(id: string): Promise<BookContent | null> {
  await ensureStore();
  return readBook(id);
}

/** url-safe slug from a title; falls back to "book" when empty. */
function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "book"
  );
}

async function uniqueId(base: string): Promise<string> {
  let id = base;
  let n = 2;
  while (await readBook(id)) {
    id = `${base}-${n++}`;
  }
  return id;
}

/** Split pasted text into paragraphs, separated by blank lines. */
export function parseParagraphs(text: string): Para[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n+/)
    .map((block) => block.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean)
    .map((c) => ({ t: "p" as const, c }));
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Remove any stored cover file(s) for a book. */
async function deleteCover(id: string): Promise<void> {
  try {
    const files = await fs.readdir(COVERS_DIR);
    await Promise.all(
      files
        .filter((f) => f.startsWith(`${id}.`))
        .map((f) => fs.rm(path.join(COVERS_DIR, f), { force: true })),
    );
  } catch {
    // covers dir may not exist yet — nothing to remove
  }
}

/** Save a cover image for a book, replacing any existing one. Returns its URL. */
async function saveCover(id: string, file: File): Promise<string> {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new Error("Cover must be a JPG, PNG, WEBP, GIF or AVIF image.");
  await deleteCover(id);
  await fs.mkdir(COVERS_DIR, { recursive: true });
  const bytes = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(COVERS_DIR, `${id}.${ext}`), bytes);
  return `/covers/${id}.${ext}`;
}

/** Derive { year, published } from an ISO date string, if valid. */
function parseDate(date?: string): { year?: number; published?: string } {
  if (!date) return {};
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return {};
  return { year: d.getFullYear(), published: date };
}

export type NewBook = {
  title: string;
  author: string;
  /** ISO publication date (yyyy-MM-dd) */
  date?: string;
  text: string;
  /** optional cover image */
  cover?: File | null;
};

/** Persist a new book to the store. Returns its generated id. */
export async function createBook(input: NewBook): Promise<string> {
  await ensureStore();

  const title = input.title.trim();
  const author = input.author.trim();
  if (!title) throw new Error("Title is required.");
  if (!author) throw new Error("Author is required.");

  const paragraphs = parseParagraphs(input.text);
  if (paragraphs.length === 0) throw new Error("Book text is empty.");

  const id = await uniqueId(slugify(title));

  let cover = "";
  if (input.cover && input.cover.size > 0) {
    cover = await saveCover(id, input.cover);
  }

  const { year = 0, published } = parseDate(input.date);
  const book: BookContent = {
    id,
    title,
    author,
    cover,
    year,
    ...(published ? { published } : {}),
    paragraphs,
  };
  await fs.writeFile(bookPath(id), JSON.stringify(book, null, 2), "utf8");
  return id;
}

export type BookEdit = {
  title: string;
  author: string;
  /** ISO publication date (yyyy-MM-dd) */
  date?: string;
  /** when provided, replaces the book text; leave empty to keep existing */
  text?: string;
  /** when provided, replaces the cover */
  cover?: File | null;
};

/** Update an existing book in place (its id is kept stable). */
export async function updateBook(id: string, input: BookEdit): Promise<void> {
  const existing = await readBook(id);
  if (!existing) throw new Error("Book not found.");

  const title = input.title.trim();
  const author = input.author.trim();
  if (!title) throw new Error("Title is required.");
  if (!author) throw new Error("Author is required.");

  let paragraphs = existing.paragraphs;
  if (input.text && input.text.trim()) {
    paragraphs = parseParagraphs(input.text);
    if (paragraphs.length === 0) throw new Error("Book text is empty.");
  }

  let cover = existing.cover;
  if (input.cover && input.cover.size > 0) {
    cover = await saveCover(id, input.cover);
  }

  const { year, published } = parseDate(input.date);
  const book: BookContent = {
    ...existing,
    title,
    author,
    cover,
    year: year ?? existing.year,
    ...(published ? { published } : {}),
    paragraphs,
  };
  await fs.writeFile(bookPath(id), JSON.stringify(book, null, 2), "utf8");
}

/** Permanently remove a book and its cover. */
export async function deleteBook(id: string): Promise<void> {
  await fs.rm(bookPath(id), { force: true });
  await deleteCover(id);
}

/** Reconstruct the editable plain text of a book from its paragraphs. */
export function bookToText(book: BookContent): string {
  return book.paragraphs.map((p) => p.c).join("\n\n");
}
