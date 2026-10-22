import { PermissionDeniedFeedback, SystemErrorFeedback } from "@/components/feedback";
import { taskConversionDefaults } from "@/features/tasks/conversion/validation/create-defaults";
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

  let currentUserId: string;
  try {
    const access = await requireBackendUser();
    currentUserId = access.userId;
  } catch (error) {
    if (error instanceof AuthorizationError && error.code === "UNAUTHENTICATED") {
      redirect(`/login?next=${encodeURIComponent(`/tasks/convert/${sourceKind}/${sourceId}`)}`);
    }
    return error instanceof AuthorizationError ? <PermissionDeniedFeedback /> : <SystemErrorFeedback />;
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
      title="Create task from meeting agenda"
    >
      <div className="mb-5"><Link className="inline-flex min-h-11 items-center text-sm font-semibold text-emerald-900 underline underline-offset-4" href={`/meetings/${source.meetingId}`}>Back to source meeting</Link></div>
      <div className="max-w-3xl">
        <TaskConversionForm
          assigneeOptions={assignees}
          conversionAction={conversionAction}
          initialValues={taskConversionDefaults(source.sourceContent, new Date(), currentUserId, assignees)}
          sourceContext={source}
          sourceLabel={source.sourceContent}
        />
      </div>
    </PageFrame>
  );
}
