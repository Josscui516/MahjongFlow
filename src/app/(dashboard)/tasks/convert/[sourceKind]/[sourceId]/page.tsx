import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageFrame } from "@/components/layout";
import { createTaskSourceReader } from "@/features/tasks/conversion/source/persistence";
import { resolveTaskSource, type TaskSourceKind } from "@/features/tasks/conversion/source";
import {
  submitTaskConversionAction,
  TaskConversionForm,
} from "@/features/tasks/conversion/validation";
import { listAssigneeOptions } from "@/features/tasks/editor/server";
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
    return <p role="alert">Access denied.</p>;
  }

  const source = await resolveTaskSource(sourceKind, sourceId, createTaskSourceReader());
  if (!source) notFound();
  const assignees = await listAssigneeOptions();
  const conversionAction = submitTaskConversionAction.bind(
    null,
    sourceKind,
    sourceId,
  );

  return (
    <PageFrame
      description="Keep the original meeting context attached while assigning ownership and a due date."
      title={`Create task from ${source.sourceKind === "decision" ? "decision" : "discussion point"}`}
    >
      <div className="mb-5"><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4" href={`/meetings/${source.meetingId}`}>Back to source meeting</Link></div>
      <div className="max-w-3xl">
        <TaskConversionForm
          assigneeOptions={assignees}
          conversionAction={conversionAction}
          initialValues={{
            assigneeId: assignees[0]?.id ?? "",
            description: "",
            dueDate: "",
            status: "not_started",
            title: "",
          }}
          sourceContext={source}
          sourceLabel={`${source.sourceKind === "decision" ? "Decision" : "Discussion point"}: ${source.sourceContent}`}
        />
      </div>
    </PageFrame>
  );
}
