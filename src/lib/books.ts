import { promises as fs } from "node:fs";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";
import type { BookContent, BookMeta, Para } from "./types";
import seedNorwegianWood from "@/content/norwegian-wood.json";

// Storage backend selection:
// - On Vercel the filesystem is read-only (except /tmp), so books and covers
//   are persisted in Vercel Blob. The token is injected automatically when a
//   Blob store is connected to the project.
// - Locally (no token) we fall back to plain on-disk files, which keeps dev
//   working with zero setup.
const useBlob = !!process.env.BLOB_READ_WRITE_TOKEN;

const SEED: BookContent[] = [seedNorwegianWood as BookContent];

// ---------------------------------------------------------------------------
// Disk backend (local development)
// ---------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data", "books");
const COVERS_DIR = path.join(process.cwd(), "public", "covers");

function diskBookPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

/** Create the data dir on first use and seed it with the bundled book(s). */
async function diskEnsureStore(): Promise<void> {
  try {
    await fs.access(DATA_DIR);
    return; // already initialised — never re-seed
  } catch {
    // not created yet
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  await Promise.all(
    SEED.map((b) =>
      fs.writeFile(diskBookPath(b.id), JSON.stringify(b, null, 2), "utf8"),
    ),
  );
}

async function diskReadBook(id: string): Promise<BookContent | null> {
  try {
    const raw = await fs.readFile(diskBookPath(id), "utf8");
    return JSON.parse(raw) as BookContent;
  } catch {
    return null;
  }
}

async function diskReadAll(): Promise<BookContent[]> {
  const files = (await fs.readdir(DATA_DIR)).filter((f) => f.endsWith(".json"));
  const books = await Promise.all(
    files.map((f) => diskReadBook(path.basename(f, ".json"))),
  );
  return books.filter((b): b is BookContent => b !== null);
}

async function diskWriteBook(book: BookContent): Promise<void> {
  await fs.writeFile(
    diskBookPath(book.id),
    JSON.stringify(book, null, 2),
    "utf8",
  );
}

async function diskRemoveBook(id: string): Promise<void> {
  await fs.rm(diskBookPath(id), { force: true });
}

async function diskSaveCover(
  id: string,
  ext: string,
  bytes: Buffer,
): Promise<string> {
  await diskDeleteCover(id);
  await fs.mkdir(COVERS_DIR, { recursive: true });
  await fs.writeFile(path.join(COVERS_DIR, `${id}.${ext}`), bytes);
  return `/covers/${id}.${ext}`;
}

async function diskDeleteCover(id: string): Promise<void> {
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

// ---------------------------------------------------------------------------
// Blob backend (Vercel)
// ---------------------------------------------------------------------------
// Vercel Blob stores are private by default, so blobs are read server-side
// with the read-write token (the public URL can't be fetched directly). Covers
// are streamed to the browser through the /api/cover/<id> route handler.
const BOOK_PREFIX = "books/";
export const COVER_PREFIX = "covers/";

function blobBookKey(id: string): string {
  return `${BOOK_PREFIX}${id}.json`;
}

/** Read a private blob's text by pathname, or null if it doesn't exist. */
async function readBlobText(pathname: string): Promise<string | null> {
  try {
    const res = await get(pathname, { access: "private", useCache: false });
    if (!res || res.statusCode !== 200) return null;
    return await new Response(res.stream).text();
  } catch {
    return null; // BlobNotFoundError and friends
  }
}

/** Seed the store with the bundled book(s) the first time it's empty. */
async function blobEnsureStore(): Promise<void> {
  const { blobs } = await list({ prefix: BOOK_PREFIX, limit: 1 });
  if (blobs.length > 0) return; // already has at least one book
  await Promise.all(SEED.map((b) => blobWriteBook(b)));
}

async function blobReadBook(id: string): Promise<BookContent | null> {
  const text = await readBlobText(blobBookKey(id));
  return text ? (JSON.parse(text) as BookContent) : null;
}

async function blobReadAll(): Promise<BookContent[]> {
  const { blobs } = await list({ prefix: BOOK_PREFIX });
  const books = await Promise.all(
    blobs
      .filter((b) => b.pathname.endsWith(".json"))
      .map(async (b) => {
        const text = await readBlobText(b.pathname);
        return text ? (JSON.parse(text) as BookContent) : null;
      }),
  );
  return books.filter((b): b is BookContent => b !== null);
}

async function blobWriteBook(book: BookContent): Promise<void> {
  await put(blobBookKey(book.id), JSON.stringify(book, null, 2), {
    access: "private",
    contentType: "application/json",
    allowOverwrite: true,
    // shortest cache the API allows; reads pass useCache:false anyway
    cacheControlMaxAge: 60,
  });
}

async function blobRemoveBook(id: string): Promise<void> {
  const key = blobBookKey(id);
  const { blobs } = await list({ prefix: key, limit: 1 });
  await Promise.all(
    blobs.filter((b) => b.pathname === key).map((b) => del(b.url)),
  );
}

async function blobSaveCover(
  id: string,
  ext: string,
  bytes: Buffer,
  contentType: string,
): Promise<string> {
  await blobDeleteCover(id);
  await put(`${COVER_PREFIX}${id}.${ext}`, bytes, {
    access: "private",
    contentType,
    allowOverwrite: true,
  });
  // served through our own route since the blob itself is private
  return `/api/cover/${id}`;
}

async function blobDeleteCover(id: string): Promise<void> {
  const { blobs } = await list({ prefix: `${COVER_PREFIX}${id}.` });
  await Promise.all(blobs.map((b) => del(b.url)));
}

// ---------------------------------------------------------------------------
// Backend-agnostic storage facade
// ---------------------------------------------------------------------------
function ensureStore(): Promise<void> {
  return useBlob ? blobEnsureStore() : diskEnsureStore();
}

function readBook(id: string): Promise<BookContent | null> {
  return useBlob ? blobReadBook(id) : diskReadBook(id);
}

function readAll(): Promise<BookContent[]> {
  return useBlob ? blobReadAll() : diskReadAll();
}

function writeBook(book: BookContent): Promise<void> {
  return useBlob ? blobWriteBook(book) : diskWriteBook(book);
}

function removeBook(id: string): Promise<void> {
  return useBlob ? blobRemoveBook(id) : diskRemoveBook(id);
}

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/** Save a cover image for a book, replacing any existing one. Returns its URL. */
async function saveCover(id: string, file: File): Promise<string> {
  const ext = EXT_BY_MIME[file.type];
  if (!ext) throw new Error("Cover must be a JPG, PNG, WEBP, GIF or AVIF image.");
  const bytes = Buffer.from(await file.arrayBuffer());
  return useBlob
    ? blobSaveCover(id, ext, bytes, file.type)
    : diskSaveCover(id, ext, bytes);
}

function deleteCover(id: string): Promise<void> {
  return useBlob ? blobDeleteCover(id) : diskDeleteCover(id);
}

/**
 * Read a stored cover image for streaming back to the browser. Only used with
 * the Blob backend (on disk, covers are served statically from /covers).
 */
export async function getCover(
  id: string,
): Promise<{ stream: ReadableStream<Uint8Array>; contentType: string } | null> {
  if (!useBlob) return null;
  const { blobs } = await list({ prefix: `${COVER_PREFIX}${id}.` });
  const hit = blobs[0];
  if (!hit) return null;
  try {
    const res = await get(hit.pathname, { access: "private" });
    if (!res || res.statusCode !== 200) return null;
    return { stream: res.stream, contentType: res.blob.contentType };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Domain logic
// ---------------------------------------------------------------------------
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

export async function getAllBooks(): Promise<BookMeta[]> {
  await ensureStore();
  const books = await readAll();
  return books
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
  await writeBook(book);
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
  await writeBook(book);
}

/** Permanently remove a book and its cover. */
export async function deleteBook(id: string): Promise<void> {
  await removeBook(id);
  await deleteCover(id);
}

/** Reconstruct the editable plain text of a book from its paragraphs. */
export function bookToText(book: BookContent): string {
  return book.paragraphs.map((p) => p.c).join("\n\n");
}
