"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { deleteEventAction } from "./editor/actions";

type DeleteError = "linked-records" | "not-found" | "permission" | "system";

const ERROR_COPY: Readonly<Record<DeleteError, string>> = {
  "linked-records": "This event has linked tasks or operational records and cannot be deleted. Keep the event or cancel it instead.",
  "not-found": "This event no longer exists. Refresh the list to see the latest records.",
  permission: "You do not have permission to delete this event.",
  system: "The event could not be deleted. Try again.",
};

export function EventDeleteButton({
  eventId,
  eventTitle,
  successHref,
}: Readonly<{
  eventId: string;
  eventTitle: string;
  successHref: string;
}>) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [error, setError] = useState<DeleteError | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function closeDialog() {
    if (pending) return;
    setError(null);
    setOpen(false);
  }

  async function confirmDelete() {
    setPending(true);
    setError(null);
    try {
      const result = await deleteEventAction(eventId);
      if (result.ok) {
        setOpen(false);
        router.replace(successHref);
        router.refresh();
        return;
      }

      setError(
        result.code === "LINKED_RECORDS"
          ? "linked-records"
          : result.code === "NOT_FOUND"
            ? "not-found"
            : result.code === "PERMISSION_DENIED"
              ? "permission"
              : "system",
      );
    } catch {
      setError("system");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        aria-label={`Delete ${eventTitle}`}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-800 transition hover:border-rose-300 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
        onClick={() => setOpen(true)}
        type="button"
      >
        Delete
      </button>
      <dialog
        aria-labelledby={`delete-event-title-${eventId}`}
        className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/50"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
        ref={dialogRef}
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200">
              <svg className="size-5" fill="none" viewBox="0 0 24 24">
                <path d="M4 7h16m-10 4v5m4-5v5M9 7l1-2h4l1 2m3 0-1 13H7L6 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight" id={`delete-event-title-${eventId}`}>Delete event?</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                <span className="font-semibold text-slate-900">{eventTitle}</span> will be permanently deleted and its QR links will stop working. Linked tasks or operational records prevent deletion.
              </p>
              <p className="mt-2 text-sm font-medium text-rose-800">This action cannot be undone.</p>
            </div>
          </div>

          {error ? (
            <p className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-900" role="alert">
              {ERROR_COPY[error]}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={pending}
              onClick={closeDialog}
              type="button"
            >
              Cancel
            </button>
            <button
              aria-busy={pending || undefined}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-rose-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700 disabled:cursor-not-allowed disabled:bg-rose-200 disabled:text-rose-800"
              disabled={pending}
              onClick={confirmDelete}
              type="button"
            >
              {pending ? "Deleting…" : "Delete event"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
