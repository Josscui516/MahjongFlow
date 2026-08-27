import Link from "next/link";

import { EmptyFeedback } from "@/components/feedback";
import { PageFrame } from "@/components/layout";
import { createTaskAction, updateTaskAction } from "@/features/tasks/editor/actions";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
import { TaskEditor } from "@/features/tasks/editor/TaskEditor";

export default async function NewTaskPage() {
  const assignees = await listAssigneeOptions();
  return (
    <PageFrame description="Record one clear action item with an owner, due date, and delivery status." title="Create task">
      <div className="mb-5"><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4" href="/tasks">Back to tasks</Link></div>
      {assignees.length ? <TaskEditor assignees={assignees} createTaskAction={createTaskAction} updateTaskAction={updateTaskAction} /> : <EmptyFeedback description="Activate at least one committee member before assigning a task." title="No active assignees" />}
    </PageFrame>
  );
}
