import { TaskEditor } from "@/features/tasks/editor/TaskEditor";
import { createTaskAction, updateTaskAction } from "@/features/tasks/editor/actions";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
export default async function NewTaskPage() { const assignees = await listAssigneeOptions(); return <main className="mx-auto max-w-4xl space-y-6 p-6"><div><h1 className="text-3xl font-bold">Create task</h1><p className="text-slate-600">Record one committee action item.</p></div>{assignees.length ? <TaskEditor assignees={assignees} port={{ createTask: createTaskAction, getTask: async () => ({ code: "SYSTEM_ERROR", ok: false }), updateTask: updateTaskAction }}/> : <p role="alert">No active assignees are available.</p>}</main>; }
