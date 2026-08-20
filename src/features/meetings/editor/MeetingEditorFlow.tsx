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
        onSaved={(record) => router.push(`/meetings/${encodeURIComponent(record.id)}`)}
        port={port}
      />
    );
  }

  return (
    <MeetingEditor
      agendaSlot={
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 [&_button]:mt-3 [&_button]:min-h-11 [&_button]:rounded-xl [&_button]:border [&_button]:border-slate-300 [&_button]:px-4 [&_button]:py-2 [&_fieldset]:mt-5 [&_fieldset]:space-y-3 [&_h2]:text-xl [&_h2]:font-bold [&_label]:block [&_label]:text-sm [&_label]:font-semibold [&_legend]:font-semibold [&_textarea]:mt-1 [&_textarea]:min-h-24 [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-slate-300 [&_textarea]:p-3">
          <MeetingAgendaSection
            agenda={props.agenda}
            onSave={(draft) => saveMeetingAgendaAction(props.initialRecord.id, draft)}
          />
        </div>
      }
      attendeeOptions={props.attendeeOptions}
      initialRecord={props.initialRecord}
      mode="update"
      onSaved={() => router.refresh()}
      port={port}
    />
  );
}
