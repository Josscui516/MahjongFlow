import Link from "next/link";
import { redirect } from "next/navigation";
import { listTasks } from "@/features/tasks/core/service";
export default async function TasksPage() {
  const result = await listTasks();
  if (!result.ok && result.code === "PERMISSION_DENIED") redirect("/login?next=%2Ftasks");
  return <main className="mx-auto max-w-5xl space-y-6 p-6"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold">Tasks</h1><p className="text-slate-600">Committee action items and their persisted status.</p></div><Link className="rounded-xl bg-emerald-950 px-4 py-3 font-semibold text-white" href="/tasks/new">Create task</Link></div>
    {!result.ok ? <p role="alert">Tasks could not be loaded.</p> : result.items.length === 0 ? <p className="rounded-2xl border bg-white p-6">No tasks yet.</p> : <ul className="space-y-3">{result.items.map((task) => <li className="rounded-2xl border bg-white p-5" key={task.id}><Link className="font-bold underline" href={`/tasks/${task.id}`}>{task.title}</Link><p className="mt-1 text-sm text-slate-600">Due {task.dueDate} · {task.status.replaceAll("_", " ")}</p></li>)}</ul>}
  </main>;
}
