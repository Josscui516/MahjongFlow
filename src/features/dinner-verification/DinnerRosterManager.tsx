"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { addDinnerRosterEntry, removeDinnerRosterMember } from "./actions";
import type { DinnerVerificationItem } from "./contracts";

export function DinnerRosterManager({ eventId, items }: Readonly<{
  eventId: string; items: readonly DinnerVerificationItem[];
}>) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true); setMessage("");
    try {
      const result = await addDinnerRosterEntry(eventId, String(data.get("fullName") ?? ""), String(data.get("email") ?? ""));
      if (result.ok) { form.reset(); setMessage("Dinner roster entry saved."); router.refresh(); }
      else setMessage(result.code === "VALIDATION" ? "Check the name and email, then retry." : "The roster could not be changed. Check your access or try again.");
    } catch { setMessage("The update could not be confirmed. Refresh before retrying."); }
    finally { setPending(false); }
  }
  async function remove(entryId: string) {
    if (pending || !window.confirm("Remove this person from the dinner roster?")) return;
    setPending(true); setMessage("");
    try {
      const result = await removeDinnerRosterMember(eventId, entryId);
      if (result.ok) { setMessage("Dinner roster entry removed."); router.refresh(); }
      else setMessage("The roster could not be changed. Check your access or try again.");
    } catch { setMessage("The update could not be confirmed. Refresh before retrying."); }
    finally { setPending(false); }
  }
  return <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" aria-labelledby="roster-management-heading">
    <h2 className="text-xl font-semibold" id="roster-management-heading">Manage dinner roster</h2>
    <p className="text-sm text-slate-600">Administrator only. Add the dinner list in advance. Activity registration and attendance do not add anyone to this list.</p>
    <form className="flex flex-wrap items-end gap-3" onSubmit={add}>
      <label className="text-sm font-semibold">Full name<input className="mt-1 block min-h-11 rounded-lg border border-slate-300 p-2" name="fullName" maxLength={120} required disabled={pending} /></label>
      <label className="text-sm font-semibold">Email<input className="mt-1 block min-h-11 rounded-lg border border-slate-300 p-2" name="email" type="email" maxLength={254} required disabled={pending} /></label>
      <button className="min-h-11 rounded-lg bg-emerald-950 px-4 text-white disabled:opacity-60" disabled={pending}>{pending ? "Saving…" : "Add to dinner roster"}</button>
    </form>
    <p role="status" aria-live="polite">{message}</p>
    <ul className="divide-y divide-slate-200">{items.filter((item) => item.eligibility === "Eligible").map((item) => <li className="flex flex-wrap items-center justify-between gap-3 py-3" key={item.participantId}>
      <span className="break-all">{item.participantName} · {item.participantEmail}</span>
      <button className="min-h-11 rounded-lg border border-rose-300 px-3 text-rose-900" disabled={pending} onClick={() => remove(item.participantId)}>Remove from dinner roster</button>
    </li>)}</ul>
  </section>;
}
