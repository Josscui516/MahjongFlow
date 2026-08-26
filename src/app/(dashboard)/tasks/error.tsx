"use client";
export default function TasksError({ reset }: Readonly<{ error: Error; reset: () => void }>) { return <main className="mx-auto max-w-5xl p-6"><h1 className="text-2xl font-bold">Tasks unavailable</h1><button className="mt-4 rounded-xl bg-emerald-950 px-4 py-2 text-white" onClick={reset}>Try again</button></main>; }
