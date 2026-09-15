import { listTasks } from "@/features/tasks/core/service";
import { setTaskEventAction } from "./actions";
import { PreparationPanel } from "./PreparationPanel";
import { getEventPreparation } from "./service";

export async function EventPreparationSection({ eventId, candidatePage = 1 }: Readonly<{ eventId: string; candidatePage?: number }>) {
  const page = Number.isSafeInteger(candidatePage) && candidatePage > 0 ? candidatePage : 1;
  const [preparation, candidates] = await Promise.all([getEventPreparation(eventId), listTasks({ page, pageSize: 20, search: "", sort: "due_soonest", status: "all" })]);
  return <div className="space-y-3">
    <PreparationPanel candidates={candidates.ok ? candidates.items : []} eventId={eventId} linkAction={setTaskEventAction} result={preparation}/>
    {!candidates.ok ? <p role="alert">Task choices could not be loaded. Refresh and try again.</p> : candidates.total > 20 || page > 1 ? <nav aria-label="Preparation task choices" className="flex items-center justify-between gap-3 text-sm">
      {page > 1 ? <a className="inline-flex min-h-11 items-center font-semibold underline" href={`/events/${eventId}?candidatePage=${page - 1}#preparation-heading`}>Previous task choices</a> : <span/>}
      <span>Task choices page {page}</span>
      {page * 20 < candidates.total ? <a className="inline-flex min-h-11 items-center font-semibold underline" href={`/events/${eventId}?candidatePage=${page + 1}#preparation-heading`}>Next task choices</a> : <span/>}
    </nav> : null}
  </div>;
}
