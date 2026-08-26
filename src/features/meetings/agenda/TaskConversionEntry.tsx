import Link from "next/link";

import type { TaskSourceKind } from "@/features/tasks/conversion/source";

export function TaskConversionEntry({ sourceId, sourceKind }: Readonly<{
  sourceId: string;
  sourceKind: TaskSourceKind;
}>) {
  const label = sourceKind === "decision" ? "Create task from decision" : "Create task from discussion point";
  return (
    <Link
      className="inline-flex min-h-10 items-center rounded-lg border border-emerald-800 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
      href={`/tasks/convert/${sourceKind}/${encodeURIComponent(sourceId)}`}
    >
      {label}
    </Link>
  );
}
