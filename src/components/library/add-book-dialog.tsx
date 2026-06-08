"use client";

import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { addBookAction, type AddBookState } from "@/app/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { BookForm } from "./book-form";

export function AddBookDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<AddBookState, FormData>(
    async (prev, formData) => {
      const result = await addBookAction(prev, formData);
      // on success, close the dialog and pull the new book onto the shelf
      if (result.ok) {
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    {},
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button className="flex aspect-2/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-(--reading-rule) text-sm text-(--reading-soft) transition-colors hover:border-(--reading-gold) hover:bg-(--reading-elev) hover:text-(--reading-gold)">
            <Plus className="size-7" strokeWidth={1.5} />
            <span>Add a book</span>
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a book to your library</DialogTitle>
          <DialogDescription>
            Upload an EPUB or PDF, or paste the text — it&rsquo;s saved to your
            shelf.
          </DialogDescription>
        </DialogHeader>

        <BookForm
          formRef={formRef}
          action={action}
          pending={pending}
          error={state.error}
          mode="add"
        />
      </DialogContent>
    </Dialog>
  );
}
