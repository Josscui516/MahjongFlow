"use client";
import { IdentityRegistrationForm } from "./IdentityRegistrationForm";
import { useEffect, useRef, useState, type ReactNode } from "react";

export function RegistrationWorkspace({ records, registration, header }: Readonly<{ records: ReactNode; registration: { eventId: string; requiresStudentId: boolean } | null; header: ReactNode }>) {
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);
  return <div className="space-y-6">
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
      <div className="min-w-0 flex-1">{header}</div>
      <button ref={triggerRef} type="button" aria-haspopup="dialog" onClick={() => { setNotice(""); setOpen(true); }} className="min-h-11 shrink-0 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2">Register participant</button>
    </div>
    {notice && <p role="status" className="rounded-lg bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p>}
    <div id="registration-records" className="min-w-0">{records}</div>
    <dialog ref={dialogRef} aria-label="Register participant" onClose={() => { setOpen(false); triggerRef.current?.focus(); }} className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-0 text-slate-950 shadow-2xl backdrop:bg-slate-950/50">
      <div className="flex justify-end px-4 pt-3"><button type="button" aria-label="Close registration form" onClick={() => dialogRef.current?.close()} className="flex size-11 items-center justify-center rounded-lg text-2xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2">&times;</button></div>
      <div className="px-2 pb-2 [&>section]:border-0 [&>section]:pt-0">{registration ? <IdentityRegistrationForm key={String(open)} {...registration} onSuccess={message => { setNotice(message); dialogRef.current?.close(); }} /> : <p role="alert">Event details are unavailable. Refresh before registering.</p>}</div>
    </dialog>
  </div>;
}
