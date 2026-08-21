export default function AccountManagementLoading() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10" aria-busy="true">
      <div className="animate-pulse space-y-5" role="status">
        <span className="sr-only">Loading committee accounts</span>
        <div className="h-9 w-72 rounded bg-slate-200" />
        <div className="h-48 rounded-2xl bg-slate-100" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-48 rounded-2xl bg-slate-100" />
          <div className="h-48 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </main>
  );
}
