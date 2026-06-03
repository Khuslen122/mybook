import { getAllBooks } from "@/lib/books";
import { BookShelf } from "@/components/library/book-shelf";

export default function LibraryPage() {
  const books = getAllBooks();
  return <BookShelf books={books} />;
}
