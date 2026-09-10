import { listTasks } from "@/features/tasks/core/service";
import { setTaskEventAction } from "./actions";
import { PreparationPanel } from "./PreparationPanel";
import { getEventPreparation } from "./service";

export async function EventPreparationSection({ eventId }: Readonly<{ eventId: string }>) {
  const [preparation, candidates] = await Promise.all([getEventPreparation(eventId), listTasks()]);
  return <PreparationPanel candidates={candidates.ok ? candidates.items : []} eventId={eventId} linkAction={setTaskEventAction} result={preparation}/>;
}

