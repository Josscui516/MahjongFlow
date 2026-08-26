import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createTaskSourceReader } from "@/features/tasks/conversion/source/persistence";
import { resolveTaskSource, type TaskSourceKind } from "@/features/tasks/conversion/source";
import { AuthorizationError, requireBackendUser } from "@/lib/auth/authorization";

function isSourceKind(value: string): value is TaskSourceKind {
  return value === "decision" || value === "discussion";
}

export default async function TaskConversionPage({ params }: Readonly<{
  params: Promise<{ sourceId: string; sourceKind: string }>;
}>) {
  const { sourceId, sourceKind } = await params;
  if (!isSourceKind(sourceKind)) notFound();

  try {
    await requireBackendUser();
  } catch (error) {
    if (error instanceof AuthorizationError && error.code === "UNAUTHENTICATED") {
      redirect(`/login?next=${encodeURIComponent(`/tasks/convert/${sourceKind}/${sourceId}`)}`);
    }
    return <main className="mx-auto max-w-2xl p-6"><p role="alert">Access denied.</p></main>;
  }

  const source = await resolveTaskSource(sourceKind, sourceId, createTaskSourceReader());
  if (!source) notFound();

  return (
    <main className="mx-auto max-w-2xl p-6">
      <Link className="text-sm font-semibold text-emerald-900 underline" href={`/meetings/${source.meetingId}`}>Back to source meeting</Link>
      <h1 className="mt-5 text-3xl font-bold text-slate-950">Create task from {source.sourceKind === "decision" ? "decision" : "discussion point"}</h1>
      <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5" aria-labelledby="source-context-heading">
        <h2 className="font-semibold text-slate-950" id="source-context-heading">Source context</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{source.sourceContent}</p>
        <p className="mt-3 text-xs text-slate-500">This source is verified on the server and cannot be edited here.</p>
      </section>
      <p className="mt-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-950" role="status">Task fields are supplied by the task conversion form work package.</p>
    </main>
  );
}
