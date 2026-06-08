"use client";

import type { RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import type { BookFormValues } from "@/app/actions";

export function BookForm({
  formRef,
  action,
  pending,
  error,
  mode,
  bookId,
  initial,
}: {
  formRef: RefObject<HTMLFormElement | null>;
  action: (formData: FormData) => void;
  pending: boolean;
  error?: string;
  mode: "add" | "edit";
  bookId?: string;
  initial?: BookFormValues;
}) {
  const isEdit = mode === "edit";

  return (
    <form ref={formRef} action={action} className="space-y-3">
      {isEdit && <input type="hidden" name="id" value={bookId} />}

      <Input
        name="title"
        required
        defaultValue={initial?.title}
        placeholder="Title"
        autoComplete="off"
      />

      <Input
        name="author"
        required
        defaultValue={initial?.author}
        placeholder="Author"
        autoComplete="off"
      />

      <div className="space-y-1.5">
        <span className="text-xs text-muted-foreground">
          Publication date (optional)
        </span>
        <DatePicker
          name="date"
          defaultValue={initial?.date || undefined}
          placeholder="Pick a publication date"
        />
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs text-muted-foreground">
          Cover image {isEdit ? "(leave empty to keep current)" : "(optional)"}
        </span>
        <Input
          name="cover"
          type="file"
          accept="image/*"
          className="cursor-pointer py-1.5"
        />
      </label>

      {!isEdit && (
        <label className="block space-y-1.5">
          <span className="text-xs text-muted-foreground">
            Import from file (EPUB or PDF)
          </span>
          <Input
            name="file"
            type="file"
            accept=".epub,.pdf,application/epub+zip,application/pdf"
            className="cursor-pointer py-1.5"
          />
          <span className="text-xs text-muted-foreground">
            Upload a book file and its text is extracted automatically — or
            paste the text below instead.
          </span>
        </label>
      )}

      <Textarea
        name="text"
        rows={9}
        defaultValue={initial?.text}
        placeholder={
          isEdit
            ? "Edit the book text. Separate paragraphs with a blank line."
            : "Or paste the book text here. Separate paragraphs with a blank line."
        }
        className="resize-y leading-relaxed"
      />

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="w-full"
      >
        {pending
          ? isEdit
            ? "Saving…"
            : "Adding…"
          : isEdit
            ? "Save changes"
            : "Add to library"}
      </Button>
    </form>
  );
}
