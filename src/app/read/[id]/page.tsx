import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllBooks, getBook } from "@/lib/books";
import { Reader } from "@/components/reader/reader";

export function generateStaticParams() {
  return getAllBooks().map((b) => ({ id: b.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const book = getBook(id);
  if (!book) return { title: "Not found" };
  return { title: `${book.title} — ${book.author}` };
}

export default async function ReadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = getBook(id);
  if (!book) notFound();
  return <Reader book={book} />;
}
