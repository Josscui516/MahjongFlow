import type { EventStatus } from "./core/contracts";

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = { scheduled: "Scheduled", completed: "Completed", cancelled: "Cancelled" };
const statusStyles: Record<EventStatus, string> = { scheduled: "border-emerald-200 bg-emerald-50 text-emerald-900", completed: "border-slate-200 bg-slate-100 text-slate-700", cancelled: "border-rose-200 bg-rose-50 text-rose-900" };
export function EventStatusBadge({ status }: Readonly<{ status: EventStatus }>) {
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold ${statusStyles[status]}`}>{EVENT_STATUS_LABELS[status]}</span>;
}
