"use client";

import Link from "next/link";
import { useEffect } from "react";

import { PageFrame } from "@/components/layout";
import { MEETING_HISTORY_DESCRIPTION } from "@/features/meetings/history";

export default function MeetingHistoryError({
  error,
  retry,
}: Readonly<{
  error: Error & { digest?: string };
  retry: () => void;
}>) {
  useEffect(() => {
    console.error("Meeting history route failed", {
      digest: error.digest ?? "unavailable",
    });
  }, [error.digest]);

  return (
    <PageFrame
      description={MEETING_HISTORY_DESCRIPTION}
      title="Meetings"
    >
      <section
        aria-labelledby="meeting-history-error-title"
        className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
        data-error-pattern="interrupted-timeline"
        data-feedback-state="error"
        role="alert"
      >
        <div className="grid lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="border-l-4 border-rose-400 px-6 py-7 sm:px-8 sm:py-9">
            <div className="flex items-center gap-2.5 text-rose-700">
              <span
                aria-hidden="true"
                className="relative grid size-7 place-items-center rounded-full bg-rose-50 ring-1 ring-inset ring-rose-200"
              >
                <span className="h-px w-3 rotate-45 bg-current" />
                <span className="absolute h-px w-3 -rotate-45 bg-current" />
              </span>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">
                History interrupted
              </p>
            </div>

            <h2
              className="mt-5 max-w-xl text-2xl font-bold tracking-tight text-slate-950"
              id="meeting-history-error-title"
            >
              Meeting records could not be loaded
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Try reconnecting to the meeting history. If the problem continues,
              return to the back office and come back later.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:ring-offset-2"
                onClick={retry}
                type="button"
              >
                Try again
              </button>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                href="/backoffice"
              >
                Return to back office
              </Link>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="hidden border-l border-slate-200 bg-slate-50/80 p-8 lg:block"
          >
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Record timeline
            </p>
            <div className="relative mt-7 space-y-7 before:absolute before:bottom-4 before:left-[5px] before:top-4 before:w-px before:bg-slate-300">
              <div className="relative pl-7">
                <span className="absolute left-0 top-1 size-[11px] rounded-full border-2 border-emerald-700 bg-slate-50" />
                <div className="h-2.5 w-20 rounded-full bg-emerald-100" />
                <div className="mt-2 h-3 w-40 rounded-full bg-slate-200" />
              </div>
              <div className="relative pl-7">
                <span className="absolute left-0 top-1 grid size-[11px] place-items-center rounded-full bg-rose-500 ring-4 ring-rose-50">
                  <span className="h-px w-1.5 rotate-45 bg-white" />
                  <span className="absolute h-px w-1.5 -rotate-45 bg-white" />
                </span>
                <div className="h-2.5 w-24 rounded-full bg-rose-100" />
                <div className="mt-2 h-3 w-32 rounded-full bg-slate-200" />
              </div>
              <div className="relative pl-7 opacity-40">
                <span className="absolute left-0 top-1 size-[11px] rounded-full border-2 border-slate-400 bg-slate-50" />
                <div className="h-2.5 w-16 rounded-full bg-slate-200" />
                <div className="mt-2 h-3 w-36 rounded-full bg-slate-200" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}
