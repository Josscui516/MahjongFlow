import type { ParticipationSummaryResult } from "./contracts";
import { registrationErrors } from "../records/messages";

export function ParticipationSummary({ result }: Readonly<{ result?: ParticipationSummaryResult }>) {
  return <section aria-label="Registration and attendance totals" className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
    <h2 className="text-xl font-semibold">Registration and attendance</h2>
    {!result ? <p role="status">Loading participation totals…</p> : !result.ok ? <p role="alert">Participation totals unavailable. {registrationErrors[result.code]}</p> : <dl className="grid grid-cols-2 gap-4">
      <div><dt className="text-sm text-slate-600">Currently registered</dt><dd className="text-3xl font-bold" data-testid="registered-count">{result.registrationCount}</dd></div>
      <div><dt className="text-sm text-slate-600">Confirmed attendance</dt><dd className="text-3xl font-bold" data-testid="attendance-count">{result.confirmedAttendanceCount}</dd></div>
    </dl>}
    <details className="text-sm text-slate-600"><summary className="min-h-11 cursor-pointer py-3 font-semibold text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2">How these totals work</summary><p>Registration does not confirm attendance or dinner eligibility. Cancelled registrations are excluded from the registration total. Confirmed attendance is counted independently from attendance records.</p>
    <p className="text-sm text-slate-600">Back-office entry can leave privacy acknowledgement unrecorded. Participant self-service registration is not enabled.</p>
    </details>
  </section>;
}
