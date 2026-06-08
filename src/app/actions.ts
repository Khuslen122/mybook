"use server";

import { revalidatePath } from "next/cache";
import {
  bookToText,
  createBook,
  deleteBook,
  getBook,
  updateBook,
} from "@/lib/books";
import { importBookFile } from "@/lib/import";

export type AddBookState = { error?: string; ok?: boolean };

function readForm(formData: FormData) {
  const date = (formData.get("date") as string | null)?.trim() || undefined;
  const cover = formData.get("cover");
  return {
    title: (formData.get("title") as string) ?? "",
    author: (formData.get("author") as string) ?? "",
    date,
    text: (formData.get("text") as string) ?? "",
    cover: cover instanceof File ? cover : null,
  };
}

/**
 * Form action: create a book. The text can be pasted into the form, or an
 * EPUB/PDF file can be uploaded and its text extracted automatically. Any
 * title/author left blank is filled from the file's metadata when available.
 */
export async function addBookAction(
  _prev: AddBookState,
  formData: FormData,
): Promise<AddBookState> {
  try {
    const fields = readForm(formData);
    const file = formData.get("file");

    if (file instanceof File && file.size > 0) {
      const parsed = await importBookFile(file);
      if (!fields.title.trim() && parsed.title) fields.title = parsed.title;
      if (!fields.author.trim() && parsed.author) fields.author = parsed.author;
      // an uploaded file always supplies the text
      fields.text = parsed.text;
    }

    await createBook(fields);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not add the book." };
  }
  revalidatePath("/");
  return { ok: true };
}

/** Form action: update an existing book. */
export async function editBookAction(
  _prev: AddBookState,
  formData: FormData,
): Promise<AddBookState> {
  const id = (formData.get("id") as string | null)?.trim();
  if (!id) return { error: "Missing book id." };
  try {
    const { title, author, date, text, cover } = readForm(formData);
    await updateBook(id, { title, author, date, text, cover });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save changes." };
  }
  revalidatePath("/");
  revalidatePath(`/read/${id}`);
  return { ok: true };
}

/** Delete a book from the library. */
export async function deleteBookAction(id: string): Promise<void> {
  await deleteBook(id);
  revalidatePath("/");
}

export type BookFormValues = {
  title: string;
  author: string;
  /** ISO publication date (yyyy-MM-dd) for prefilling the date picker */
  date: string;
  text: string;
};

/** Load an existing book's editable fields to prefill the edit form. */
export async function getBookForEdit(id: string): Promise<BookFormValues | null> {
  const book = await getBook(id);
  if (!book) return null;
  const date =
    book.published ?? (book.year ? `${book.year}-01-01` : "");
  return {
    title: book.title,
    author: book.author,
    date,
    text: bookToText(book),
  };
}
