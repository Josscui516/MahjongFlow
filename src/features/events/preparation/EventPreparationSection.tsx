import { listTasks } from "@/features/tasks/core/service";
import type { TaskListResult } from "@/features/tasks/core/contracts";
import { setTaskEventAction } from "./actions";
import { PreparationPanel } from "./PreparationPanel";
import { getEventPreparation } from "./service";

async function allTaskChoices(): Promise<TaskListResult> {
  const criteria = { page: 1, pageSize: 100, search: "", sort: "due_soonest" as const, status: "all" as const };
  const first = await listTasks(criteria);
  if (!first.ok) return first;
  const items = [...first.items];
  const pageCount = Math.ceil(first.total / criteria.pageSize);
  for (let page = 2; page <= pageCount; page += 4) {
    const batch = await Promise.all(Array.from(
      { length: Math.min(4, pageCount - page + 1) },
      (_, index) => listTasks({ ...criteria, page: page + index }),
    ));
    for (const next of batch) {
      if (!next.ok) return next;
      items.push(...next.items);
    }
  }
  return { ok: true, items: [...new Map(items.map(task => [task.id, task])).values()], total: first.total };
}

export async function EventPreparationSection({ eventId }: Readonly<{ eventId: string }>) {
  const [preparation, candidates] = await Promise.all([getEventPreparation(eventId), allTaskChoices()]);
  const candidateControls = !candidates.ok ? <p role="alert">Task choices could not be loaded. Refresh and try again.</p> : null;
  return <PreparationPanel candidates={candidates.ok ? candidates.items : []} candidateControls={candidateControls} eventId={eventId} linkAction={setTaskEventAction} result={preparation}/>;
}
