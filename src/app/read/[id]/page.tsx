import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBook } from "@/lib/books";
import { Reader } from "@/components/reader/reader";

// books live on disk and are added at runtime, so render per request
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) return { title: "Not found" };
  return { title: `${book.title} — ${book.author}` };
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = await getBook(id);
  if (!book) notFound();
  return <Reader book={book} />;
}
