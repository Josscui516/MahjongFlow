"use client";
import { useFormStatus } from "react-dom";

export function PreparationSubmitButton({ remove = false }: Readonly<{ remove?: boolean }>) {
  const { pending } = useFormStatus();
  return <button disabled={pending} aria-busy={pending} className={`min-h-11 self-end rounded-lg px-4 font-semibold disabled:opacity-60 ${remove ? "text-rose-800 hover:bg-rose-50" : "bg-emerald-950 text-white"}`} type="submit">{pending ? "Updating…" : remove ? "Remove from event" : "Add to event"}</button>;
}
