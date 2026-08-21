import type { ReactNode } from "react";

import { MeetingEditorRouteLayout } from "@/features/meetings/editor/MeetingEditorRouteLayout";

export default function NewMeetingLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <MeetingEditorRouteLayout
      currentPath="/meetings/new"
      loginNextPath="/meetings/new"
    >
      {children}
    </MeetingEditorRouteLayout>
  );
}
