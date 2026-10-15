"use client";

import { useRef, useState, type FormEvent } from "react";

import type {
  BasicTokenMutationResult,
  CheckInTokenStatus,
  CheckInWindowInput,
  TokenMutationResult,
  WindowMutationResult,
} from "./contracts";

type Props = Readonly<{
  configureWindow: (input: CheckInWindowInput) => Promise<WindowMutationResult>;
  initialStatus: CheckInTokenStatus;
  revokeToken: () => Promise<BasicTokenMutationResult>;
  rotateToken: () => Promise<TokenMutationResult>;
}>;

function localDateTime(value: string | null) {
  if (!value) return "";
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      day: "2-digit", hour: "2-digit", hourCycle: "h23", minute: "2-digit",
      month: "2-digit", timeZone: "Australia/Sydney", year: "numeric",
    }).formatToParts(new Date(value)).map(({ type, value: part }) => [type, part]),
  );
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function safeMessage(code: string) {
  if (code === "EVENT_NOT_SCHEDULED") return "QR registration is available only for Scheduled events. Check this event's status.";
  if (code === "WINDOW_REQUIRED") return "Save the registration opening and closing times before generating a QR link.";
  return code === "PERMISSION_DENIED"
    ? "You do not have permission to manage event registration."
    : code === "NOT_FOUND"
      ? "The event is no longer available."
      : "Registration settings could not be updated. Try again.";
}

export function TokenManager({ configureWindow, initialStatus, revokeToken, rotateToken }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [generated, setGenerated] = useState<Extract<TokenMutationResult, { ok: true }> | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [pending, setPending] = useState<"window" | "rotate" | "revoke" | null>(null);
  const actionLock = useRef(false);

  async function saveWindow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actionLock.current) return;
    actionLock.current = true; setPending("window"); setMessage(""); setErrors({});
    const data = new FormData(event.currentTarget);
    const input = { closesAt: String(data.get("closesAt") ?? ""), opensAt: String(data.get("opensAt") ?? "") };
    try {
      const result = await configureWindow(input);
      if (!result.ok) {
        if (result.code === "VALIDATION") setErrors(Object.fromEntries((result.errors ?? []).map(error => [error.field, error.message])));
        else setMessage(safeMessage(result.code));
        return;
      }
      setStatus(current => ({ ...current, closesAt: result.closesAt, opensAt: result.opensAt }));
      setMessage("Registration window saved in Sydney time.");
    } catch { setMessage("The update could not be confirmed. Refresh before retrying."); }
    finally { actionLock.current = false; setPending(null); }
  }

  async function rotate() {
    if (actionLock.current) return;
    actionLock.current = true; setPending("rotate"); setMessage(""); setGenerated(null);
    try {
      const result = await rotateToken();
      if (!result.ok) { setMessage(safeMessage(result.code)); return; }
      setGenerated(result);
      setStatus(current => ({ ...current, active: true, createdAt: result.createdAt, revokedAt: null }));
      setMessage("A new registration link was generated. Save it now; it will not be shown again.");
    } catch { setMessage("The new link could not be confirmed. Refresh before retrying."); }
    finally { actionLock.current = false; setPending(null); }
  }

  async function revoke() {
    if (actionLock.current) return;
    actionLock.current = true; setPending("revoke"); setMessage(""); setGenerated(null);
    try {
      const result = await revokeToken();
      if (!result.ok) { setMessage(safeMessage(result.code)); return; }
      setStatus(current => ({ ...current, active: false, revokedAt: new Date().toISOString() }));
      setMessage("The active registration link was revoked.");
    } catch { setMessage("Revocation could not be confirmed. Refresh before retrying."); }
    finally { actionLock.current = false; setPending(null); }
  }

  return <section aria-labelledby="registration-token-heading" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">Administrator or authorised access</p>
      <h2 className="mt-1 text-xl font-bold text-slate-950" id="registration-token-heading">QR registration entry</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">Configure the Sydney-time window, then generate a revocable event-only link. The plaintext link is displayed once.</p>
    </div>
    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700" role="status">
      Token status: <strong>{status.active ? "Active" : "No active token"}</strong>
      {status.createdAt ? <> · Last generated <time dateTime={status.createdAt}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }).format(new Date(status.createdAt))}</time></> : null}
    </p>
    <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={saveWindow}>
      <label className="text-sm font-semibold text-slate-800">Opens (Sydney time)
        <input aria-describedby={errors.opensAt ? "registration-opens-error" : undefined} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3" defaultValue={localDateTime(status.opensAt)} disabled={pending !== null} name="opensAt" type="datetime-local" />
        {errors.opensAt ? <span className="mt-1 block text-sm text-rose-700" id="registration-opens-error" role="alert">{errors.opensAt}</span> : null}
      </label>
      <label className="text-sm font-semibold text-slate-800">Closes (Sydney time)
        <input aria-describedby={errors.closesAt ? "registration-closes-error" : undefined} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3" defaultValue={localDateTime(status.closesAt)} disabled={pending !== null} name="closesAt" type="datetime-local" />
        {errors.closesAt ? <span className="mt-1 block text-sm text-rose-700" id="registration-closes-error" role="alert">{errors.closesAt}</span> : null}
      </label>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold" disabled={pending !== null} type="submit">{pending === "window" ? "Saving…" : "Save window"}</button>
        <button className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white" disabled={pending !== null || !status.opensAt || !status.closesAt} onClick={rotate} type="button">{pending === "rotate" ? "Generating…" : status.active ? "Rotate QR link" : "Generate QR link"}</button>
        <button className="min-h-11 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800" disabled={pending !== null || !status.active} onClick={revoke} type="button">{pending === "revoke" ? "Revoking…" : "Revoke active link"}</button>
      </div>
    </form>
    {message ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950" role="status">{message}</p> : null}
    {generated ? <div className="grid gap-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:grid-cols-[20rem_1fr]" data-one-time-token="true">
      {/* A data URL avoids sending the secret QR value through a second request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Event-specific registration QR code" className="w-full max-w-80 rounded-lg bg-white p-3" height="320" src={generated.qrDataUrl} width="320" />
      <div className="min-w-0"><h3 className="font-semibold text-emerald-950">Save this link now</h3><p className="mt-2 text-sm text-emerald-900">For security, MahjongFlow cannot recover this plaintext after you leave or generate another link.</p><label className="mt-4 block text-sm font-semibold text-emerald-950">Registration URL<input className="mt-2 block min-h-11 w-full rounded-lg border border-emerald-300 bg-white px-3 text-sm" onFocus={event => event.currentTarget.select()} readOnly value={generated.url} /></label></div>
    </div> : null}
  </section>;
}
