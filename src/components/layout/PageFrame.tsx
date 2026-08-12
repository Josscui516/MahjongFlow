import type { ReactNode } from "react";

export type PageFrameProps = Readonly<{
  children: ReactNode;
  description?: string;
  feedbackSlot?: ReactNode;
  primaryAction?: ReactNode;
  title: string;
}>;

/**
 * Keeps the narrow-screen reading order as title, feedback, primary action,
 * then content. Visual and DOM order stay aligned at every breakpoint so
 * keyboard focus never jumps between reordered interactive regions.
 */
export function PageFrame({
  children,
  description,
  feedbackSlot,
  primaryAction,
  title,
}: PageFrameProps) {
  return (
    <div className="space-y-5">
      <header className="min-w-0">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 sm:text-base">
            {description}
          </p>
        ) : null}
      </header>

      {feedbackSlot ? <div>{feedbackSlot}</div> : null}

      {primaryAction ? (
        <div className="flex justify-start md:justify-end">{primaryAction}</div>
      ) : null}

      <section aria-label={`${title} content`} className="min-w-0">
        {children}
      </section>
    </div>
  );
}
