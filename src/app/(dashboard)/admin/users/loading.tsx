import { RouteLoadingStatus } from "@/components/feedback";

function SkeletonLine({ className }: Readonly<{ className: string }>) {
  return <div className={`rounded-full bg-slate-200 ${className}`} />;
}

export default function AccountManagementLoading() {
  return (
    <div className="space-y-8" data-feedback-state="loading">
      <header>
        <SkeletonLine className="h-4 w-28" />
        <SkeletonLine className="mt-4 h-8 w-64 max-w-full" />
        <div className="mt-4 max-w-3xl space-y-2">
          <SkeletonLine className="h-3 w-full bg-slate-100" />
          <SkeletonLine className="h-3 w-4/5 bg-slate-100" />
        </div>
      </header>

      <section aria-busy="true" className="space-y-4" role="status">
        <RouteLoadingStatus
          description="preparing invitations and the current committee directory."
          title="Loading committee accounts"
        />

        <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <SkeletonLine className="h-5 w-36" />
            <SkeletonLine className="mt-3 h-3 w-3/5 bg-slate-100" />
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div className="h-12 rounded-xl bg-slate-100" />
              <div className="h-12 rounded-xl bg-slate-100" />
            </div>
            <div className="mt-5 h-11 w-36 rounded-xl bg-emerald-100" />
          </section>

          <section className="space-y-4">
            <div>
              <SkeletonLine className="h-5 w-40" />
              <SkeletonLine className="mt-3 h-3 w-72 max-w-full bg-slate-100" />
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {["first", "second"].map((row) => (
                <div
                  className="grid gap-3 border-b border-slate-200 p-5 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_10rem]"
                  key={row}
                >
                  <div className="space-y-3">
                    <SkeletonLine className="h-4 w-48 max-w-full" />
                    <SkeletonLine className="h-3 w-64 max-w-full bg-slate-100" />
                  </div>
                  <div className="h-10 rounded-xl bg-slate-100" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
