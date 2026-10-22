"use client";

import { useLinkStatus } from "next/link";

export function MeetingCreateLabel({ children }: Readonly<{ children: React.ReactNode }>) {
  const { pending } = useLinkStatus();

  return (
    <span aria-live="polite" className="inline-grid">
      <span className={pending ? "invisible col-start-1 row-start-1" : "col-start-1 row-start-1"}>
        {children}
      </span>
      {pending ? <span className="col-start-1 row-start-1">Opening editor…</span> : null}
    </span>
  );
}
