import { EmptyFeedback, LoadingFeedback, SystemErrorFeedback } from "@/components/feedback";

export function SourceNavigationLoading({ subject }: Readonly<{ subject: "related tasks" | "source details" }>) {
  return (
    <LoadingFeedback
      description={`The latest ${subject} are being prepared. Please wait.`}
      title={`Loading ${subject}`}
    />
  );
}

export function SourceNavigationEmpty({ subject }: Readonly<{ subject: "related tasks" | "source details" }>) {
  return subject === "related tasks" ? (
    <EmptyFeedback
      description="Tasks created from this meeting will appear here."
      title="No sourced tasks yet"
    />
  ) : (
    <EmptyFeedback
      description="This task was created without a meeting decision or discussion point source."
      title="No meeting source"
    />
  );
}

export function SourceNavigationUnavailable() {
  return (
    <section
      aria-live="assertive"
      className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-950 shadow-sm sm:p-6"
      data-source-navigation-state="unavailable"
      role="alert"
    >
      <h2 className="font-semibold">Source information unavailable</h2>
      <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
        The source information cannot be displayed. Return to a page you can access or try again later.
      </p>
    </section>
  );
}

export function SourceNavigationSystemError() {
  return <SystemErrorFeedback />;
}
