import Link from "next/link";
import { notFound } from "next/navigation";

import { getTask } from "@/features/tasks/core/service";
import { SourceTraceabilityPanel } from "@/features/tasks/source-navigation/SourceTraceabilityPanel";
import { readTaskSource } from "@/features/tasks/source-navigation/service";

export default async function TaskPage({
  params,
  searchParams,
}: Readonly<{
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ saved?: string }>;
}>) {
  const [{ taskId }, query] = await Promise.all([params, searchParams]);
  const result = await getTask(taskId);

  if (!result.ok) {
    if (result.code === "NOT_FOUND") notFound();
    return <p role="alert">This task is unavailable.</p>;
  }

  const task = result.record;
  const sourceResult = await readTaskSource(task);

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      {query.saved === "1" ? (
        <p className="rounded-xl border border-emerald-300 bg-emerald-50 p-3" role="status">
          Task saved.
        </p>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h1 className="break-words text-3xl font-bold">{task.title}</h1>
        <Link
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-emerald-950 px-4 py-3 font-semibold text-white"
          href={`/tasks/${encodeURIComponent(task.id)}/edit`}
        >
          Edit task
        </Link>
      </div>
      <dl className="grid gap-4 rounded-2xl border bg-white p-6 sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Description</dt>
          <dd className="whitespace-pre-wrap break-words">{task.description}</dd>
        </div>
        <div>
          <dt className="font-semibold">Due date</dt>
          <dd>{task.dueDate}</dd>
        </div>
        <div>
          <dt className="font-semibold">Status</dt>
          <dd>{task.status.replaceAll("_", " ")}</dd>
        </div>
        <div>
          <dt className="font-semibold">Assignee</dt>
          <dd className="break-words">{task.assigneeId}</dd>
        </div>
      </dl>
      <SourceTraceabilityPanel result={sourceResult} />
    </main>
  );
}
