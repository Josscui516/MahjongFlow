import Link from "next/link";
import { REGISTRATION_PAGE_SIZE, type RegistrationListResult, type RegistrationMutationPort } from "./contracts";
import { registrationErrors } from "./messages";
import { RegistrationStatusForm } from "./RegistrationForms";

export function RegistrationList({ result, changeStatus }: Readonly<{
  result: RegistrationListResult;
  changeStatus: RegistrationMutationPort["changeStatus"];
}>) {
  if (!result.ok) return <p role="alert">{registrationErrors[result.code]}</p>;
  return <section aria-label="Registration records" className="space-y-4">
    <h2 className="text-xl font-semibold text-slate-950" tabIndex={-1}>Registration records</h2>
    <p className="text-sm text-slate-600">{result.total} registration {result.total === 1 ? "record" : "records"}, including cancelled registrations.</p>
    {result.items.length === 0 ? <p>No registrations on this page.</p> : <ul className="space-y-3">
      {result.items.map((item) => <li key={item.id} className="min-w-0 space-y-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="[overflow-wrap:anywhere]"><h3 className="font-semibold">{item.participantName}</h3><p>{item.participantEmail}</p><p className="font-medium">{item.status === "registered" ? "Registered" : "Cancelled"}</p></div>
        <RegistrationStatusForm eventId={result.eventId} item={item} changeStatus={changeStatus} />
        <p className="text-sm text-slate-600">Privacy acknowledgement: {item.privacyNoticeAcknowledgedAt ? <time dateTime={item.privacyNoticeAcknowledgedAt}>{new Intl.DateTimeFormat("en-AU", { dateStyle: "medium", timeStyle: "short", timeZone: "Australia/Sydney" }).format(new Date(item.privacyNoticeAcknowledgedAt))}</time> : "Not recorded (permitted for back-office entry)"}</p>
      </li>)}
    </ul>}
    <nav aria-label="Registration pages" className="flex gap-4">
      {result.page > 1 && <Link className="underline" href={`/registrations/${result.eventId}?page=${result.page - 1}`}>Previous page</Link>}
      {result.page * REGISTRATION_PAGE_SIZE < result.total && <Link className="underline" href={`/registrations/${result.eventId}?page=${result.page + 1}`}>Next page</Link>}
    </nav>
  </section>;
}
