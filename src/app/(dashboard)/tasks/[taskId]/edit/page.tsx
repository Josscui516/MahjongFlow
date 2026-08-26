import { notFound } from "next/navigation";
import { getTask } from "@/features/tasks/core/service";
import { TaskEditor } from "@/features/tasks/editor/TaskEditor";
import { createTaskAction, updateTaskAction } from "@/features/tasks/editor/actions";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
export default async function EditTaskPage({ params }: Readonly<{ params: Promise<{ taskId: string }> }>) { const { taskId } = await params; const [result, assignees] = await Promise.all([getTask(taskId), listAssigneeOptions()]); if (!result.ok) { if (result.code === "NOT_FOUND") notFound(); return <p role="alert">This task is unavailable.</p>; } return <main className="mx-auto max-w-4xl space-y-6 p-6"><h1 className="text-3xl font-bold">Edit task</h1><TaskEditor assignees={assignees} initialRecord={result.record} port={{ createTask: createTaskAction, getTask, updateTask: updateTaskAction }}/></main>; }
