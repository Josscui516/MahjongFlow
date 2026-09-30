"use client";

export default function DinnerError({ reset }: Readonly<{ reset: () => void }>) {
  return <div role="alert" className="space-y-4 rounded-xl border border-amber-200 bg-amber-50 p-6">
    <p>Dinner verification is unavailable. Try again before serving dinner.</p>
    <button onClick={reset} className="rounded-lg bg-emerald-700 px-4 py-2 font-semibold text-white">Try again</button>
  </div>;
}
