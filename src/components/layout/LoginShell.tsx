import { useId, type ReactNode } from "react";

export type LoginShellProps = Readonly<{
  children: ReactNode;
  description?: string;
  feedbackSlot?: ReactNode;
  title?: string;
}>;

export function LoginShell({
  children,
  description = "Use your committee account to continue.",
  feedbackSlot,
  title = "Sign in",
}: LoginShellProps) {
  const titleId = useId();

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-10 text-slate-950">
      <section
        aria-labelledby={titleId}
        className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
      >
        <div className="bg-emerald-950 px-6 py-7 text-white sm:px-8">
          <p className="text-xl font-bold tracking-tight">MahjongFlow</p>
          <p className="mt-1 text-sm text-emerald-100">
            Committee coordination
          </p>
        </div>

        <div className="space-y-6 px-6 py-7 sm:px-8 sm:py-8">
          <header>
            <h1
              className="text-2xl font-bold tracking-tight"
              id={titleId}
            >
              {title}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {description}
            </p>
          </header>

          {feedbackSlot}
          {children}
        </div>
      </section>
    </main>
  );
}
