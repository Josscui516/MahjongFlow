"use client";

export default function AttendanceError({
  reset,
}: Readonly<{ reset: () => void }>) {
  return (
    <section className="space-y-4 p-6">
      <p role="alert">Attendance records could not be loaded.</p>
      <button
        className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 font-semibold"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </section>
  );
}
