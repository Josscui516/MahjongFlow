"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import type { MeetingRecordDTO } from "./contracts";
import { createBrowserFixtureMeetingEditorPort } from "./fixturePort";
import { MeetingEditor } from "./MeetingEditor";
import { MeetingLoadingSkeleton, MeetingStatePanel } from "./MeetingStatePanel";

type DetailState =
  | Readonly<{ kind: "loading" }>
  | Readonly<{ kind: "not-found" }>
  | Readonly<{ kind: "ready"; record: MeetingRecordDTO }>
  | Readonly<{ kind: "system-error" }>;

export function FixtureMeetingEditorFlow(
  props: Readonly<
    | { mode: "create" }
    | { meetingId: string; mode: "update" }
  >,
) {
  const port = useMemo(() => createBrowserFixtureMeetingEditorPort(), []);
  const router = useRouter();
  const meetingId = props.mode === "update" ? props.meetingId : null;
  const [detailState, setDetailState] = useState<DetailState>({
    kind: "loading",
  });

  useEffect(() => {
    if (!meetingId) return;

    let active = true;
    void port.getMeeting(meetingId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setDetailState({ kind: "ready", record: result.record });
      } else if (result.code === "NOT_FOUND") {
        setDetailState({ kind: "not-found" });
      } else {
        setDetailState({ kind: "system-error" });
      }
    });

    return () => {
      active = false;
    };
  }, [meetingId, port]);

  if (props.mode === "create") {
    return (
      <MeetingEditor
        mode="create"
        onSaved={(record) =>
          router.push(`/meetings/${encodeURIComponent(record.id)}`)
        }
        port={port}
      />
    );
  }

  if (detailState.kind === "loading") {
    return (
      <div aria-label="Loading meeting" role="status">
        <span className="sr-only">Loading meeting details</span>
        <MeetingLoadingSkeleton />
      </div>
    );
  }

  if (detailState.kind === "not-found") {
    return (
      <MeetingStatePanel
        action={
          <Link className="font-semibold underline underline-offset-2" href="/meetings/new">
            Create a meeting
          </Link>
        }
        description="This meeting is not available in the current browser fixture."
        state="system"
        title="Meeting not found"
      />
    );
  }

  if (detailState.kind === "system-error") {
    return (
      <MeetingStatePanel
        description="The browser fixture could not load this meeting. Refresh and try again."
        state="system"
        title="Something went wrong"
      />
    );
  }

  return (
    <MeetingEditor
      initialRecord={detailState.record}
      mode="update"
      port={port}
    />
  );
}
