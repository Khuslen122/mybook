import { getAllBooks } from "@/lib/books";
import { BookShelf } from "@/components/library/book-shelf";

// books are read from disk and can change at runtime, so render per request
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const books = await getAllBooks();
  return <BookShelf books={books} />;
}
