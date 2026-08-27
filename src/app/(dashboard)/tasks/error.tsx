"use client";

import { SystemErrorFeedback } from "@/components/feedback";

export default function TasksError({ reset }: Readonly<{ error: Error; reset: () => void }>) {
  return <SystemErrorFeedback action={<button className="min-h-11 rounded-xl bg-emerald-950 px-5 py-3 text-sm font-semibold text-white" onClick={reset}>Try again</button>} />;
}
