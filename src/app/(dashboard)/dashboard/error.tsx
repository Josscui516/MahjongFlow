"use client";

export default function DashboardError({ reset }: Readonly<{ error: Error; reset: () => void }>) {
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-slate-950">Dashboard unavailable</h1>
      <p className="mt-3 text-sm text-slate-700" role="alert">The Dashboard could not be loaded. No task or event data has been displayed.</p>
      <button className="mt-5 rounded-xl bg-emerald-950 px-4 py-2 font-semibold text-white" onClick={reset} type="button">Try again</button>
    </main>
  );
}
