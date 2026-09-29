import type {
  AttendanceAuditFailureCode,
  AttendanceAuditResult,
} from "./contracts";

const failureMessages = {
  PERMISSION_DENIED:
    "You do not have permission to view attendance audit records.",
  SYSTEM_ERROR:
    "Attendance audit records could not be loaded. Please try again.",
  UNAUTHENTICATED: "Sign in to view attendance audit records.",
  UNAVAILABLE: "This event is no longer available.",
  VALIDATION: "The selected event is invalid.",
} satisfies Record<AttendanceAuditFailureCode, string>;

const auditDate = new Intl.DateTimeFormat("en-AU", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Australia/Sydney",
});

function formatTimestamp(value: string): string {
  return auditDate.format(new Date(value));
}

export function AttendanceAuditLoading() {
  return <p role="status">Loading attendance audit records…</p>;
}

export function AttendanceAuditList({
  result,
}: Readonly<{ result: AttendanceAuditResult }>) {
  if (!result.ok) {
    return <p role="alert">{failureMessages[result.code]}</p>;
  }

  return (
    <section aria-labelledby="attendance-audit-heading" className="space-y-4">
      <div className="space-y-1">
        <h2
          className="text-xl font-semibold text-slate-950"
          id="attendance-audit-heading"
          tabIndex={-1}
        >
          Attendance audit
        </h2>
        <p className="text-sm text-slate-600">
          {result.event.name} · {result.items.length}{" "}
          {result.items.length === 1 ? "record" : "records"}
        </p>
      </div>

      {result.items.length === 0 ? (
        <p>No attendance records have been recorded for this event.</p>
      ) : (
        <ul className="space-y-3">
          {result.items.map((item) => (
            <li
              className="rounded-xl border border-slate-200 bg-white p-4"
              key={item.id}
            >
              <h3 className="font-semibold text-slate-950">
                {item.participantName}
              </h3>
              <p className="[overflow-wrap:anywhere] text-sm text-slate-600">
                {item.participantEmail}
              </p>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <dt className="font-medium text-slate-700">Event</dt>
                  <dd>{result.event.name}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Status</dt>
                  <dd>{item.status === "confirmed" ? "Confirmed" : "Voided"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Method</dt>
                  <dd>{item.method === "qr" ? "QR" : "Manual"}</dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Checked in</dt>
                  <dd>
                    <time dateTime={item.checkedInAt}>
                      {formatTimestamp(item.checkedInAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Updated</dt>
                  <dd>
                    <time dateTime={item.updatedAt}>
                      {formatTimestamp(item.updatedAt)}
                    </time>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-slate-700">Recorded by</dt>
                  <dd>
                    {item.recordedBy?.displayName ?? "Self-service QR"}
                  </dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
