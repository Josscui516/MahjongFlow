"use client";
import { useFormStatus } from "react-dom";

export function PreparationSubmitButton({ remove = false, taskTitle }: Readonly<{ remove?: boolean; taskTitle?: string }>) {
  const { pending } = useFormStatus();
  return <button aria-label={remove && taskTitle ? `Remove ${taskTitle} from event` : undefined} disabled={pending} aria-busy={pending} className={`min-h-11 self-end rounded-lg px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 ${remove ? "text-slate-600 hover:bg-slate-100 hover:text-slate-900" : "bg-emerald-950 text-white"}`} type="submit">{pending ? "Updating…" : remove ? "Remove from event" : "Add to event"}</button>;
}
