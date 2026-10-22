"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

import { copyRegistrationLink } from "./copy-link";
import { initialWindowInput, localDateTime } from "./window-defaults";

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
  eventStartsAt: string;
  revokeToken: () => Promise<BasicTokenMutationResult>;
  rotateToken: () => Promise<TokenMutationResult>;
}>;

function safeMessage(code: string) {
  if (code === "EVENT_NOT_SCHEDULED") return "QR registration is available only for Scheduled events. Check this event's status.";
  if (code === "WINDOW_REQUIRED") return "Save the registration opening and closing times before generating a QR link.";
  return code === "PERMISSION_DENIED"
    ? "You do not have permission to manage event registration."
    : code === "NOT_FOUND"
      ? "The event is no longer available."
      : "Registration settings could not be updated. Try again.";
}

export function TokenManager({ configureWindow, initialStatus, eventStartsAt, revokeToken, rotateToken }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [editingWindow, setEditingWindow] = useState(!initialStatus.active);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [windowInput, setWindowInput] = useState(() => initialWindowInput(initialStatus, eventStartsAt));
  const hasSavedWindow = Boolean(status.opensAt && status.closesAt);
  const windowDirty = windowInput.opensAt !== localDateTime(status.opensAt) || windowInput.closesAt !== localDateTime(status.closesAt);
  const [generated, setGenerated] = useState<Extract<TokenMutationResult, { ok: true }> | null>(null);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [pending, setPending] = useState<"window" | "rotate" | "revoke" | null>(null);
  const actionLock = useRef(false);
  const confirmationRef = useRef<HTMLDialogElement>(null);
  const confirmationOpener = useRef<HTMLElement | null>(null);
  const [confirmation, setConfirmation] = useState<"replace" | "revoke" | null>(null);
  useEffect(() => {
    if (confirmation && confirmationRef.current && !confirmationRef.current.open) confirmationRef.current.showModal();
  }, [confirmation]);
  function askConfirmation(action: "replace" | "revoke") {
    confirmationOpener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setConfirmation(action);
  }
  function closeConfirmation() {
    confirmationRef.current?.close();
    setConfirmation(null);
    confirmationOpener.current?.focus();
  }

  async function saveWindow(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (actionLock.current || (hasSavedWindow && !windowDirty)) return;
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
      setWindowInput({ opensAt: localDateTime(result.opensAt), closesAt: localDateTime(result.closesAt) });
      setMessage("Registration window saved in Sydney time.");
      if (status.active) setEditingWindow(false);
    } catch { setMessage("The update could not be confirmed. Refresh before retrying."); }
    finally { actionLock.current = false; setPending(null); }
  }

  async function rotate(confirmed = false) {
    if (actionLock.current || !hasSavedWindow || windowDirty) return;
    if (status.active && !confirmed) { askConfirmation("replace"); return; }
    actionLock.current = true; setPending("rotate"); setMessage("");
    try {
      const result = await rotateToken();
      if (!result.ok) { setMessage(safeMessage(result.code)); return; }
      setGenerated(result);
      setCopyState("idle");
      setEditingWindow(false);
      setStatus(current => ({ ...current, active: true, createdAt: result.createdAt, revokedAt: null }));
      setMessage("");
    } catch { setMessage("The new link could not be confirmed. Refresh before retrying."); }
    finally { actionLock.current = false; setPending(null); }
  }

  async function revoke(confirmed = false) {
    if (actionLock.current) return;
    if (!confirmed) { askConfirmation("revoke"); return; }
    actionLock.current = true; setPending("revoke"); setMessage("");
    try {
      const result = await revokeToken();
      if (!result.ok) { setMessage(safeMessage(result.code)); return; }
      setStatus(current => ({ ...current, active: false, revokedAt: new Date().toISOString() }));
      setGenerated(null);
      setEditingWindow(true);
      setMessage("The active registration link was revoked.");
    } catch { setMessage("Revocation could not be confirmed. Refresh before retrying."); }
    finally { actionLock.current = false; setPending(null); }
  }

  return <section aria-labelledby="registration-token-heading" className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
    <div>
      <h2 className="text-xl font-bold text-slate-950" id="registration-token-heading">QR registration</h2>
    </div>
    <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700" role="status">
      Registration link: <strong>{status.active ? "Active" : status.revokedAt ? "Revoked" : "Not generated"}</strong>
      {status.createdAt ? <> · Last generated <time dateTime={status.createdAt}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }).format(new Date(status.createdAt))}</time></> : null}
    </p>
    {!editingWindow && status.active ? <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-3"><p className="text-sm text-slate-700"><span className="font-semibold">Registration window: </span>{status.opensAt && status.closesAt ? `${new Intl.DateTimeFormat("en-AU", {dateStyle:"medium",timeStyle:"short",timeZone:"Australia/Sydney"}).format(new Date(status.opensAt))} – ${new Intl.DateTimeFormat("en-AU", {dateStyle:"medium",timeStyle:"short",timeZone:"Australia/Sydney"}).format(new Date(status.closesAt))} · Sydney` : "Not configured"}</p><button type="button" className="min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-700 disabled:opacity-50" disabled={pending !== null} onClick={() => setEditingWindow(true)}>Edit times</button></div> : null}
    {editingWindow || !status.active ? <form className="grid gap-4 sm:grid-cols-2" noValidate onSubmit={saveWindow}>
      <label className="text-sm font-semibold text-slate-800">Opens (Sydney time)
        <input aria-describedby={errors.opensAt ? "registration-opens-error" : undefined} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3" value={windowInput.opensAt} onChange={event => setWindowInput(current => ({ ...current, opensAt: event.target.value }))} onInput={event => { const value = event.currentTarget.value; setWindowInput(current => ({ ...current, opensAt: value })); }} disabled={pending !== null} name="opensAt" type="datetime-local" />
        {errors.opensAt ? <span className="mt-1 block text-sm text-rose-700" id="registration-opens-error" role="alert">{errors.opensAt}</span> : null}
      </label>
      <label className="text-sm font-semibold text-slate-800">Closes (Sydney time)
        <input aria-describedby={errors.closesAt ? "registration-closes-error" : undefined} className="mt-2 block min-h-11 w-full rounded-lg border border-slate-300 px-3" value={windowInput.closesAt} onChange={event => setWindowInput(current => ({ ...current, closesAt: event.target.value }))} onInput={event => { const value = event.currentTarget.value; setWindowInput(current => ({ ...current, closesAt: value })); }} disabled={pending !== null} name="closesAt" type="datetime-local" />
        {errors.closesAt ? <span className="mt-1 block text-sm text-rose-700" id="registration-closes-error" role="alert">{errors.closesAt}</span> : null}
      </label>
      <div className="flex flex-wrap gap-3 sm:col-span-2">
        <button className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50" disabled={pending !== null || (hasSavedWindow && !windowDirty)} type="submit">{pending === "window" ? "Saving…" : "Save window"}</button>
        {!status.active ? <button className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500" aria-describedby={!hasSavedWindow || windowDirty ? "qr-window-hint" : undefined} disabled={pending !== null || !hasSavedWindow || windowDirty} onClick={() => rotate()} type="button">{pending === "rotate" ? "Generating…" : "Generate QR link"}</button> : null}
      </div>
    </form> : null}
    {editingWindow && (!hasSavedWindow || windowDirty) ? <p id="qr-window-hint" className="text-sm text-slate-600">{windowDirty && hasSavedWindow ? "Save your time changes before generating a QR link." : "Set and save the opening and closing times to enable QR generation."}</p> : null}
    {message ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950" role="status">{message}</p> : null}
    {generated ? <div className="grid gap-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 md:grid-cols-[16rem_1fr]" data-one-time-token="true">
      {/* A data URL avoids sending the secret QR value through a second request. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img alt="Event-specific registration QR code" className="w-full max-w-64 rounded-lg bg-white p-3" height="256" src={generated.qrDataUrl} width="256" />
      <div className="min-w-0"><h3 className="font-semibold text-emerald-950">QR link ready</h3><p className="mt-2 text-sm text-emerald-900">Copy the link or download the QR code before leaving. They cannot be displayed again after you leave this page.</p>
        <label className="mt-4 block text-sm font-semibold text-emerald-950">Registration URL<input className="mt-2 block min-h-11 w-full rounded-lg border border-emerald-300 bg-white px-3 text-sm" onFocus={event => event.currentTarget.select()} readOnly value={generated.url} /></label>
        <div className="mt-3 flex flex-wrap gap-3"><button type="button" className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white" onClick={async () => setCopyState(await copyRegistrationLink(generated.url) ? "copied" : "failed")}>{copyState === "copied" ? "Copied" : "Copy link"}</button><a className="inline-flex min-h-11 items-center rounded-lg border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-950" download="event-registration-qr.png" href={generated.qrDataUrl}>Download QR</a></div>
        <p role="status" aria-live="polite" className="mt-2 text-sm text-emerald-950">{copyState === "copied" ? "Link copied to clipboard." : copyState === "failed" ? "Copy was unavailable. Select the registration URL and copy it manually." : ""}</p>
      </div>
    </div> : status.active ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-950">Your link is active. Use your saved link or QR code. If you no longer have it, generate a replacement below.</p> : null}
    {status.active ? <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-4"><button className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending !== null || !hasSavedWindow || windowDirty} onClick={() => rotate()} type="button">{pending === "rotate" ? "Generating…" : "Generate replacement link"}</button><button className="min-h-11 rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={pending !== null} onClick={() => revoke()} type="button">{pending === "revoke" ? "Revoking…" : "Revoke active link"}</button><p className="text-sm text-slate-600">Replacing or revoking a link makes the old QR code stop working.</p></div> : null}
    <dialog ref={confirmationRef} aria-labelledby="qr-confirmation-title" aria-describedby="qr-confirmation-description" onCancel={event => { event.preventDefault(); closeConfirmation(); }} className="m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-slate-200 bg-white p-6 text-slate-950 shadow-xl backdrop:bg-slate-950/40">
      <h3 id="qr-confirmation-title" className="text-lg font-bold">{confirmation === "replace" ? "Replace QR link?" : "Revoke QR link?"}</h3>
      <p id="qr-confirmation-description" className="mt-3 text-sm leading-6 text-slate-600">{confirmation === "replace" ? "The current link and QR code will stop working. Share the replacement QR code with participants." : "The current link and QR code will stop accepting registration and check-in."}</p>
      <div className="mt-5 flex flex-wrap justify-end gap-3"><button autoFocus type="button" onClick={closeConfirmation} className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button type="button" className="min-h-11 rounded-lg bg-emerald-950 px-4 py-2 text-sm font-semibold text-white" onClick={async () => { const action = confirmation; closeConfirmation(); if (action === "replace") await rotate(true); else if (action === "revoke") await revoke(true); }}>{confirmation === "replace" ? "Generate replacement" : "Revoke link"}</button></div>
    </dialog>
  </section>;
}
