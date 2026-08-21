"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { MeetingAgendaSection } from "@/features/meetings/agenda/MeetingAgendaSection";
import type { MeetingAgendaDTO } from "@/features/meetings/agenda/contracts";

import { createMeetingAction, getMeetingAction, saveMeetingAgendaAction, updateMeetingAction } from "./actions";
import type { MeetingAttendeeOption, MeetingEditorPort, MeetingRecordDTO } from "./contracts";
import { MeetingEditor } from "./MeetingEditor";

type Props = Readonly<
  | { attendeeOptions: readonly MeetingAttendeeOption[]; mode: "create" }
  | {
      agenda: MeetingAgendaDTO;
      attendeeOptions: readonly MeetingAttendeeOption[];
      initialRecord: MeetingRecordDTO;
      justCreated?: boolean;
      mode: "update";
    }
>;

export function MeetingEditorFlow(props: Props) {
  const router = useRouter();
  const port = useMemo<MeetingEditorPort>(() => ({
    createMeeting: createMeetingAction,
    getMeeting: getMeetingAction,
    updateMeeting: updateMeetingAction,
  }), []);

  if (props.mode === "create") {
    return (
      <MeetingEditor
        attendeeOptions={props.attendeeOptions}
        mode="create"
        onSaved={(record) => router.push(`/meetings/${encodeURIComponent(record.id)}?created=1#meeting-agenda-heading`)}
        port={port}
      />
    );
  }

  return (
    <MeetingEditor
      agendaSlot={
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <MeetingAgendaSection
            agenda={props.agenda}
            focusOnMount={props.justCreated}
            onSave={(draft) => saveMeetingAgendaAction(props.initialRecord.id, draft)}
          />
        </div>
      }
      attendeeOptions={props.attendeeOptions}
      initialRecord={props.initialRecord}
      justCreated={props.justCreated}
      mode="update"
      onSaved={() => router.refresh()}
      port={port}
    />
  );
}
