import Link from "next/link";
export default function TaskNotFound() { return <main className="mx-auto max-w-3xl p-6"><h1 className="text-2xl font-bold">Task not found</h1><Link className="mt-4 inline-block underline" href="/tasks">Return to tasks</Link></main>; }
