"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import {
  deleteBookAction,
  editBookAction,
  getBookForEdit,
  type AddBookState,
  type BookFormValues,
} from "@/app/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookForm } from "./book-form";

export function BookActions({ id, title }: { id: string; title: string }) {
  return (
    <div className="absolute left-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover/card:opacity-100 focus-within:opacity-100">
      <EditButton id={id} />
      <DeleteButton id={id} title={title} />
    </div>
  );
}

function IconBtn(props: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="flex size-7 items-center justify-center rounded-full bg-black/60 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/80"
    />
  );
}

function EditButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [initial, setInitial] = useState<BookFormValues | null>(null);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<AddBookState, FormData>(
    async (prev, formData) => {
      const result = await editBookAction(prev, formData);
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
      return result;
    },
    {},
  );

  async function onOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      setInitial(null);
      setInitial(await getBookForEdit(id));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <IconBtn aria-label="Edit book" title="Edit" onClick={() => onOpenChange(true)}>
        <Pencil className="size-3.5" />
      </IconBtn>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit book</DialogTitle>
          <DialogDescription>Update the details or text.</DialogDescription>
        </DialogHeader>
        {initial ? (
          <BookForm
            formRef={formRef}
            action={action}
            pending={pending}
            error={state.error}
            mode="edit"
            bookId={id}
            initial={initial}
          />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading…</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function confirmDelete() {
    startTransition(async () => {
      await deleteBookAction(id);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <IconBtn
        aria-label="Delete book"
        title="Delete"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5" />
      </IconBtn>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete this book?</DialogTitle>
          <DialogDescription>
            “{title}” will be permanently removed from your library. This cannot
            be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={confirmDelete}
          >
            {pending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
