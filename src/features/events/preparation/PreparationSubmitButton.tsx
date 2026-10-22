"use client";
import { useFormStatus } from "react-dom";

export function PreparationSubmitButton({ remove = false, taskTitle, disabled = false }: Readonly<{ remove?: boolean; taskTitle?: string; disabled?: boolean }>) {
  const { pending } = useFormStatus();
  return <button aria-label={remove && taskTitle ? `Unlink ${taskTitle} from event` : undefined} title={remove ? "Unlink from this event. The task will be kept." : undefined} disabled={pending || disabled} aria-busy={pending} className={`min-h-11 self-end rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${remove ? "text-slate-500 underline underline-offset-4 hover:bg-slate-100 hover:text-slate-900" : "bg-emerald-950 text-white"}`} type="submit">{pending ? "Updating…" : remove ? "Unlink" : "Add to event"}</button>;
}
