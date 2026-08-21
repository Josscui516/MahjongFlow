"use client";

export default function AccountManagementError({
  reset,
}: Readonly<{ error: Error & { digest?: string }; reset: () => void }>) {
  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <section className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm" role="alert">
        <h1 className="text-xl font-bold text-slate-950">Account service unavailable</h1>
        <p className="mt-2 text-slate-600">
          No confirmed change was made. Try loading the account directory again.
        </p>
        <button
          className="mt-5 rounded-xl bg-emerald-950 px-4 py-2.5 text-sm font-semibold text-white"
          onClick={reset}
          type="button"
        >
          Try again
        </button>
      </section>
    </main>
  );
}
