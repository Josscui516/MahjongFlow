import type { ReactNode } from "react";

export function MeetingPageHeader({
  action,
  description,
  title,
}: Readonly<{
  action?: ReactNode;
  description: string;
  title: string;
}>) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}
