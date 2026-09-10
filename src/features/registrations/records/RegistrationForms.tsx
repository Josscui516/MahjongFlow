"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { RegistrationItem, RegistrationMutationPort, RegistrationMutationResult } from "./contracts";
import { registrationMessage } from "./messages";

function MutationForm({ label, submit }: Readonly<{ label: string; submit: () => Promise<RegistrationMutationResult> }>) {
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<RegistrationMutationResult | null>(null);
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    lock.current = true; setPending(true); setResult(null);
    try {
      const response = await submit();
      setResult(response);
      if (response.ok || response.code === "CONFLICT") router.refresh();
    } catch { setResult({ ok: false, code: "SYSTEM_ERROR" }); }
    finally { lock.current = false; setPending(false); }
  }
  return <form onSubmit={onSubmit} className="space-y-2">
    <button type="submit" disabled={pending} className="min-h-11 rounded-lg border border-emerald-800 px-4 py-2 font-semibold text-emerald-950 disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2">{pending ? "Saving…" : label}</button>
    {result && <p role={result.ok ? "status" : "alert"} className="text-sm [overflow-wrap:anywhere]">{registrationMessage(result)}</p>}
  </form>;
}

/** #26 supplies a resolved, authorised participant; this component collects no identity fields. */
export function RegistrationCreateForm({ eventId, participant, register }: Readonly<{
  eventId: string;
  participant: Readonly<{ id: string; label: string }>;
  register: RegistrationMutationPort["register"];
}>) {
  return <section className="rounded-xl border border-slate-200 bg-white p-4">
    <h2 className="mb-2 font-semibold [overflow-wrap:anywhere]">Register {participant.label}</h2>
    <MutationForm key={`${eventId}:${participant.id}`} label="Register participant" submit={() => register({ eventId, participantId: participant.id })} />
  </section>;
}
export function RegistrationStatusForm({ eventId, item, changeStatus }: Readonly<{
  eventId: string;
  item: Pick<RegistrationItem, "id" | "status" | "updatedAt">;
  changeStatus: RegistrationMutationPort["changeStatus"];
}>) {
  return <MutationForm label={item.status === "registered" ? "Cancel registration" : "Restore registration"}
    submit={() => changeStatus({ eventId, registrationId: item.id, status: item.status === "registered" ? "cancelled" : "registered", expectedUpdatedAt: item.updatedAt })} />;
}
