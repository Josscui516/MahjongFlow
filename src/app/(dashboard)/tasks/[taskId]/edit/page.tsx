import { listTaskEventOptions } from "@/features/tasks/event-link";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyFeedback, SystemErrorFeedback } from "@/components/feedback";
import { PageFrame } from "@/components/layout";
import { getTask } from "@/features/tasks/core/service";
import { createTaskAction, updateTaskAction } from "@/features/tasks/editor/actions";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
import { TaskEditor } from "@/features/tasks/editor/TaskEditor";

export default async function EditTaskPage({ params }: Readonly<{ params: Promise<{ taskId: string }> }>) {
  const { taskId } = await params;
  const [result, assignees] = await Promise.all([getTask(taskId), listAssigneeOptions()]);
  if (!result.ok) { if (result.code === "NOT_FOUND") notFound(); return <SystemErrorFeedback />; }
  const events = await listTaskEventOptions();
  return (
    <PageFrame description="Update the owner, due date, content, or progress of this action item." title="Edit task">
      <div className="mb-5"><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4" href={`/tasks/${taskId}`}>Back to task</Link></div>
      {assignees.length ? <TaskEditor eventOptions={events.ok ? events.items : []} assignees={assignees} createTaskAction={createTaskAction} initialRecord={result.record} updateTaskAction={updateTaskAction} /> : <EmptyFeedback description="Activate a committee member before editing task ownership." title="No active assignees" />}
    </PageFrame>
  );
}
