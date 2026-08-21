import type { ReactNode } from "react";

import { MeetingEditorRouteLayout } from "@/features/meetings/editor/MeetingEditorRouteLayout";

export default async function MeetingDetailLayout({
  children,
  params,
}: Readonly<{
  children: ReactNode;
  params: Promise<{ meetingId: string }>;
}>) {
  const { meetingId } = await params;
  const meetingPath = `/meetings/${encodeURIComponent(meetingId)}`;

  return (
    <MeetingEditorRouteLayout
      currentPath={meetingPath}
      loginNextPath={meetingPath}
    >
      {children}
    </MeetingEditorRouteLayout>
  );
}
