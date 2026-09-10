"use client";
import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ParticipantIdentityInput, type ParticipantIdentityFieldErrors } from "@/features/registrations/participants";
import { registerIdentityAction } from "./identity-action";
import { registrationMessage } from "./messages";

export function IdentityRegistrationForm({ eventId, requiresStudentId }: Readonly<{ eventId: string; requiresStudentId: boolean }>) {
  const router = useRouter();
  const lock = useRef(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [succeeded, setSucceeded] = useState(false);
  const [errors, setErrors] = useState<ParticipantIdentityFieldErrors>({});
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    const form = new FormData(event.currentTarget);
    lock.current = true; setPending(true); setMessage(""); setErrors({}); setSucceeded(false);
    try {
      const result = await registerIdentityAction(eventId, form);
      if (!result.ok && result.code === "VALIDATION") {
        const fields: Partial<Record<"fullName" | "email" | "studentId", string[]>> = {};
        for (const error of result.fieldErrors) (fields[error.field] ??= []).push(error.message);
        setErrors(fields);
      }
      setMessage(registrationMessage(result)); setSucceeded(result.ok);
      if (result.ok) router.refresh();
    } catch { setMessage("Registration could not be confirmed. Retry with the same details; duplicates are safely detected."); }
    finally { lock.current = false; setPending(false); }
  }
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="mb-4 text-xl font-semibold">Register participant</h2>
    <form onSubmit={submit} noValidate className="space-y-4">
      <ParticipantIdentityInput defaultValues={{ fullName: "", email: "", studentId: "" }} requiresStudentId={requiresStudentId} disabled={pending} fieldErrors={errors} status={pending ? "pending" : "idle"} />
      <button disabled={pending} className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 font-semibold text-white disabled:opacity-50" type="submit">{pending ? "Saving…" : "Register participant"}</button>
      {message && <p role={succeeded ? "status" : "alert"}>{message}</p>}
    </form>
  </section>;
}
